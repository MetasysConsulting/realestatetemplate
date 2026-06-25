#!/usr/bin/env node
/**
 * PropertyRadar bulk HTML scraper — harvest unsaved listings from the live list,
 * then visit each detail URL in the same window (no list round-trips per listing).
 *
 * Usage:
 *   pnpm scrape-propertyradar-html
 *   pnpm scrape-propertyradar-pilot -- --limit 10
 *   pnpm scrape-propertyradar-pilot -- --from-harvest --limit 100
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { parsePropertyRadarDetailHtml } from "./lib/parse-propertyradar-detail-html.mjs";
import { listingIdFor } from "./lib/parse-propertyradar-export-html.mjs";
import {
  countHtmlSnapshots,
  formatProgressLine,
  HTML_DEBUG_DIR,
  logProgress,
  writeProgress,
  writeHeartbeat,
} from "./lib/propertyradar-scraper-progress.mjs";
import {
  PILOT_IMAGES,
  PILOT_ROOT,
  ensurePilotDirs,
  loadPilotStore,
  savePilotStore,
  upsertPilotListing,
} from "./lib/propertyradar-pilot-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIST_URL = "https://app.propertyradar.com/#!/myLists/List%20to%20be%20exported";
const SESSION_FILE = path.join(PILOT_ROOT, "session.json");
const HARVEST_FILE = path.join(PILOT_ROOT, "list-harvest.json");
const SCROLL_STATE_FILE = path.join(PILOT_ROOT, "list-scroll.json");
const HARVEST_INDEX_FILE = path.join(PILOT_ROOT, "harvest-index.json");
const MAX_TIMEOUT = 40_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const args = {
    limit: null,
    goal: 5000,
    batchSize: 500,
    workers: 1,
    resume: true,
    htmlOnly: false,
    autoContinue: true,
    stopOnError: true,
    pauseMs: 2500,
    slowMo: 200,
    fromHarvest: false,
    expandTabs: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--from-harvest") args.fromHarvest = true;
    else if (arg === "--expand-tabs") args.expandTabs = true;
    else if (arg === "--resume") args.resume = true;
    else if (arg === "--no-resume") args.resume = false;
    else if (arg === "--html-only") args.htmlOnly = true;
    else if (arg === "--auto-continue") args.autoContinue = true;
    else if (arg === "--no-auto-continue") args.autoContinue = false;
    else if (arg === "--stop-on-error") args.stopOnError = true;
    else if (arg === "--no-stop-on-error") args.stopOnError = false;
    else if (arg === "--limit") args.limit = Number(argv[++i]);
    else if (arg === "--goal") args.goal = Number(argv[++i]);
    else if (arg === "--batch-size") args.batchSize = Number(argv[++i]);
    else if (arg === "--workers") args.workers = Number(argv[++i]);
    else if (arg === "--pause") args.pauseMs = Number(argv[++i]);
    else if (arg === "--headless") {
      console.warn("Note: headless is disabled — browser always runs visible.");
    }
  }
  return args;
}

function htmlSnapshotPath(listingId) {
  return path.join(HTML_DEBUG_DIR, `${listingId}.html`);
}

function hasHtmlSnapshot(listingId) {
  const file = htmlSnapshotPath(listingId);
  return fs.existsSync(file) && fs.statSync(file).size > 50_000;
}

let storeLock = Promise.resolve();

function withStoreLock(fn) {
  const run = storeLock.then(fn);
  storeLock = run.catch(() => {});
  return run;
}

async function tryAutoLogin(page, email, password) {
  await page.waitForSelector('input[name="userEmail"]', { timeout: MAX_TIMEOUT });
  await page.fill('input[name="userEmail"]', email);
  await page.fill('input[name="userPW"]', password);
  await page.locator('input[name="userAgreement"]').check({ force: true }).catch(() => {});
  await page.locator('a:has-text("Login"), span:has-text("Login")').first().click({ force: true });
  await sleep(8000);
  return !(await page.$('input[name="userEmail"]'));
}

async function isAppReady(page) {
  return page.evaluate(() => {
    const login = document.querySelector('input[name="userEmail"]');
    const app = document.querySelector('[data-componentid="radarViewport"]');
    return !!app && !login;
  });
}

async function ensureLoggedIn(page, context, { force = false } = {}) {
  if (force) {
    if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
    await context.clearCookies();
  }

  console.log("Opening PropertyRadar…");
  await page.goto("https://app.propertyradar.com/", { waitUntil: "domcontentloaded", timeout: MAX_TIMEOUT });
  await sleep(3000);

  let onLoginPage = !!(await page.$('input[name="userEmail"]'));
  let appReady = await isAppReady(page);

  if (force || onLoginPage || !appReady) {
    if (!onLoginPage && !appReady) {
      console.log("Session expired — clearing cookies…");
      await context.clearCookies();
      await page.goto("https://app.propertyradar.com/", { waitUntil: "domcontentloaded", timeout: MAX_TIMEOUT });
      await sleep(3000);
      onLoginPage = !!(await page.$('input[name="userEmail"]'));
    }

    if (onLoginPage) {
      console.log("Logging in…");
      const ok = await tryAutoLogin(page, process.env.PROPERTYRADAR_EMAIL, process.env.PROPERTYRADAR_PASSWORD);
      if (!ok) throw new Error("Login failed — check PROPERTYRADAR_EMAIL / PROPERTYRADAR_PASSWORD in .env.local");
      await saveSession(context);
      console.log("Logged in.\n");
    } else {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (await isAppReady(page)) return;
        console.log(`  → app not ready, waiting… (${attempt + 1}/3)`);
        await sleep(5000);
        await page.goto("https://app.propertyradar.com/", { waitUntil: "domcontentloaded", timeout: MAX_TIMEOUT });
        await sleep(3000);
      }
      if (!(await isAppReady(page))) {
        throw new Error("PropertyRadar app did not load after login attempt");
      }
    }
  } else {
    console.log("Already logged in.\n");
  }
}

async function saveSession(context) {
  ensurePilotDirs();
  fs.writeFileSync(SESSION_FILE, JSON.stringify(await context.storageState(), null, 2));
}

async function waitForListGrid(page, context, canRetry = true) {
  console.log("  → opening list…");
  try {
    await page.goto(LIST_URL, { waitUntil: "domcontentloaded", timeout: MAX_TIMEOUT });
    await page.waitForSelector("table[data-recordid]", { timeout: MAX_TIMEOUT });
    await sleep(1500);
  } catch (error) {
    if (canRetry && context) {
      console.log("  → list did not load — fresh login and retry…");
      await ensureLoggedIn(page, context, { force: true });
      return waitForListGrid(page, context, false);
    }
    throw error;
  }
}

async function readVisibleListRows(listPage) {
  return listPage.evaluate(() => {
    const rows = [];
    for (const table of document.querySelectorAll("table[data-recordid]")) {
      const recordId = table.getAttribute("data-recordid");
      const cells = [...table.querySelectorAll(".x-grid-cell-inner")]
        .map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim())
        .filter((c) => c && !c.includes("properties_"));
      if (cells.length < 2) continue;
      const html = table.innerHTML ?? "";
      const radarMatch = html.match(
        /displayAttributePopup\(event,\s*(?:&#39;|'|")(P[A-F0-9]+)(?:&#39;|'|")/i,
      );
      rows.push({
        recordId,
        address: cells[0],
        city: cells[1],
        radarId: radarMatch?.[1] ?? null,
      });
    }
    return rows;
  });
}

async function readListScrollTop(page) {
  return page.evaluate(() => {
    const g =
      document.querySelector(".x-grid-view .x-scroller") ??
      document.querySelector(".x-grid-view");
    return g?.scrollTop ?? 0;
  });
}

async function setListScrollTop(page, scrollTop) {
  await page.evaluate((top) => {
    const g =
      document.querySelector(".x-grid-view .x-scroller") ??
      document.querySelector(".x-grid-view");
    if (g) g.scrollTop = top;
  }, scrollTop);
}

function loadListScrollState() {
  try {
    const data = JSON.parse(fs.readFileSync(SCROLL_STATE_FILE, "utf8"));
    return Number(data.scrollTop) || 0;
  } catch {
    return 0;
  }
}

function saveListScrollState(scrollTop) {
  if (scrollTop <= 0) return;
  ensurePilotDirs();
  fs.writeFileSync(
    SCROLL_STATE_FILE,
    JSON.stringify({ scrollTop, updatedAt: new Date().toISOString() }, null, 2),
  );
}

function clearListScrollState() {
  ensurePilotDirs();
  fs.writeFileSync(
    SCROLL_STATE_FILE,
    JSON.stringify({ scrollTop: 0, updatedAt: new Date().toISOString() }, null, 2),
  );
}

async function resetListToTop(page) {
  await page.locator(".x-grid-view").first().click({ timeout: 5000 }).catch(() => {});
  await page.keyboard.press("Home");
  await sleep(600);
  clearListScrollState();
}

function loadHarvestIndex() {
  try {
    return Number(JSON.parse(fs.readFileSync(HARVEST_INDEX_FILE, "utf8")).nextIndex) || 0;
  } catch {
    return 0;
  }
}

function saveHarvestIndex(nextIndex) {
  ensurePilotDirs();
  fs.writeFileSync(
    HARVEST_INDEX_FILE,
    JSON.stringify({ nextIndex, updatedAt: new Date().toISOString() }, null, 2),
  );
}

async function readAllStoreListings(page) {
  return page.evaluate(() => {
    const rows = [];
    if (typeof Ext === "undefined") return { rows, source: "none" };
    for (const grid of Ext.ComponentQuery.query("gridpanel, grid")) {
      const store = grid.getStore?.();
      if (!store?.getCount?.()) continue;
      for (let i = 0; i < store.getCount(); i++) {
        const d = store.getAt(i)?.data ?? {};
        const address = String(d.Address ?? d.address ?? "").trim();
        const city = String(d.City ?? d.city ?? "").trim();
        const radarId = d.RadarID ?? d.RadarId ?? d.radarId ?? null;
        if (address && city) rows.push({ address, city, radarId });
      }
      if (rows.length) return { rows, source: "ext-store" };
    }
    return { rows, source: "none" };
  });
}

function resolveRadarId(row, radarIdByListing) {
  const listingId = listingIdFor(row.address, row.city);
  return row.radarId ?? radarIdByListing.get(listingId) ?? null;
}

function makeSeed(row, radarIdByListing) {
  const listingId = listingIdFor(row.address, row.city);
  return {
    recordId: row.recordId ?? null,
    listingId,
    address: row.address,
    city: row.city,
    radarId: resolveRadarId(row, radarIdByListing),
    seedSource: "live-list",
  };
}

function loadHarvestRadarIds() {
  const map = new Map();
  if (!fs.existsSync(HARVEST_FILE)) return map;
  try {
    const data = JSON.parse(fs.readFileSync(HARVEST_FILE, "utf8"));
    for (const row of data.listings ?? []) {
      if (row.radarId && row.listingId) map.set(row.listingId, row.radarId);
    }
  } catch {
    // optional fallback file
  }
  return map;
}

function buildQueueFromHarvest(args, shared, radarIdByListing) {
  if (!fs.existsSync(HARVEST_FILE)) {
    throw new Error(`Harvest file not found: ${HARVEST_FILE}`);
  }
  const data = JSON.parse(fs.readFileSync(HARVEST_FILE, "utf8"));
  const listings = data.listings ?? [];
  const target = args.limit ?? args.batchSize;
  const queue = [];
  let alreadySaved = 0;

  for (const row of listings) {
    if (queue.length >= target) break;
    if (!row.radarId || !row.listingId) continue;
    if (args.resume && hasHtmlSnapshot(row.listingId)) {
      alreadySaved++;
      continue;
    }
    radarIdByListing.set(row.listingId, row.radarId);
    queue.push({
      listingId: row.listingId,
      address: row.address,
      city: row.city,
      radarId: row.radarId,
      seedSource: row.seedSource ?? "list-harvest",
    });
  }

  shared.batchSkipped = alreadySaved;
  console.log(
    `  → harvest file: ${listings.length} total, ${alreadySaved} already saved, ${queue.length} to visit`,
  );
  return queue;
}

async function scrollListDown(listPage) {
  return listPage.evaluate(() => {
    const g =
      document.querySelector(".x-grid-view .x-scroller") ??
      document.querySelector(".x-grid-view") ??
      document.querySelector(".x-scroller");
    if (!g) return { atEnd: true };
    const before = g.scrollTop;
    g.scrollTop += Math.max(200, Math.floor(g.clientHeight * 0.85));
    const atEnd = g.scrollTop <= before || g.scrollTop >= g.scrollHeight - g.clientHeight - 2;
    return { atEnd };
  });
}

/** Save detail page HTML from the current page. */
async function saveDetailHtmlFromPage(page, seed, radarId, pauseMs, htmlOnly) {
  const url = `https://app.propertyradar.com/#!/discover/detail/${radarId}`;
  ensurePilotDirs();
  fs.mkdirSync(HTML_DEBUG_DIR, { recursive: true });
  const htmlPath = htmlSnapshotPath(seed.listingId);
  const html = await page.content();
  fs.writeFileSync(htmlPath, html);

  if (htmlOnly) {
    return {
      ...seed,
      radarId,
      detailUrl: url,
      htmlSnapshot: path.relative(ROOT, htmlPath),
      scrapeStatus: "html_saved",
      htmlSavedAt: new Date().toISOString(),
    };
  }

  const parsed = parsePropertyRadarDetailHtml(html);
  let imageUrl = parsed.overviewPhotoUrl;
  let localImagePath = null;

  if (imageUrl) {
    try {
      const destPath = path.join(PILOT_IMAGES, `${seed.listingId}.jpg`);
      await downloadImage(page, imageUrl, destPath);
      localImagePath = path.relative(ROOT, destPath);
    } catch {
      // extract later
    }
  }

  const scrapeStatus =
    imageUrl && localImagePath ? "ok" : imageUrl ? "image_download_failed" : "no_photo_in_html";

  return {
    ...seed,
    radarId: parsed.radarId ?? radarId,
    address: parsed.address ?? seed.address,
    propertyType: parsed.propertyType ?? seed.propertyType,
    bedrooms: parsed.bedrooms ?? seed.bedrooms,
    bathrooms: parsed.bathrooms ?? seed.bathrooms,
    yearBuilt: parsed.yearBuilt ?? seed.yearBuilt,
    squareFootage: parsed.squareFootage ?? seed.squareFootage,
    estValue: parsed.estValue ?? seed.estValue,
    estEquity: parsed.estEquity ?? seed.estEquity,
    lotSize: parsed.lotSize ?? seed.lotSize,
    distressScore: parsed.distressScore ?? seed.distressScore,
    detailUrl: url,
    imageUrl,
    imageSource: imageUrl ? "overview-aerial-html" : null,
    localImagePath,
    htmlSnapshot: path.relative(ROOT, htmlPath),
    scrapeStatus,
    scrapedAt: new Date().toISOString(),
  };
}

const DETAIL_TABS = [
  { label: "Value & Equity", pattern: "Est\\.|Equity|Purchase Price" },
  { label: "Transactions", pattern: "Grantee|Grantor|Sale Amount|Recording Date|No transaction" },
  { label: "Listings", pattern: "Days on Market|MLS|List Price|Active|No listing" },
  { label: "Neighborhood", pattern: "Median|Comparable|Neighborhood" },
];

async function expandDetailTabs(page) {
  const hasTabs = await page
    .waitForSelector("span.x-tab-inner-property-profile", { timeout: 15_000 })
    .catch(() => null);
  if (!hasTabs) {
    console.log("  → detail tabs not found — saving overview only");
    return;
  }

  for (const tab of DETAIL_TABS) {
    const locator = page.locator("span.x-tab-inner-property-profile").filter({ hasText: tab.label }).first();
    if ((await locator.count()) === 0) {
      console.log(`  → tab not found: ${tab.label}`);
      continue;
    }
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.click({ force: true });
    console.log(`  → tab: ${tab.label}`);
    await page
      .waitForFunction(
        ({ pattern }) => new RegExp(pattern, "i").test(document.body?.innerText ?? ""),
        { pattern: tab.pattern },
        { timeout: 12_000 },
      )
      .catch(() => {});
    await sleep(1200);
  }
}

async function openDetailPage(page, radarId, { pauseMs = 2500, expandTabs = false } = {}) {
  await page.goto(`https://app.propertyradar.com/#!/discover/detail/${radarId}`, {
    waitUntil: "domcontentloaded",
    timeout: MAX_TIMEOUT,
  });
  await page
    .waitForFunction(
      () => location.hash.includes("/detail/") && document.body?.innerText?.includes("Radar"),
      { timeout: MAX_TIMEOUT },
    )
    .catch(async () => {
      await sleep(2500);
    });
  await sleep(pauseMs);
  if (expandTabs) await expandDetailTabs(page);
}

async function downloadImage(page, url, destPath) {
  const response = await page.request.get(url);
  if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
  fs.writeFileSync(destPath, Buffer.from(await response.body()));
}

/** Phase 1: scroll the list, pull rows from DOM + Ext store until queue is full. */
async function harvestBatchQueue(page, context, args, shared, radarIdByListing, batchTarget) {
  await waitForListGrid(page, context);
  await resetListToTop(page);
  console.log("  → harvesting from top of list");

  const queue = [];
  const queuedIds = new Set();
  const seenRecordIds = new Set();
  let rowsSeen = 0;
  let storeIndex = 0;
  saveHarvestIndex(0);
  let lastStoreSize = 0;
  let stagnantAtEnd = 0;
  let stagnantNoStoreGrowth = 0;
  let lastHeartbeat = 0;

  const heartbeat = (status) => {
    const now = Date.now();
    if (now - lastHeartbeat < 8000) return;
    lastHeartbeat = now;
    writeHeartbeat({
      ...shared.progressBase(),
      batchSaved: shared.batchSaved,
      batchSkipped: shared.batchSkipped,
      batchErrors: shared.batchErrors,
      totalSaved: countHtmlSnapshots(),
      status: status ?? "harvesting",
    });
  };

  const tryAddRow = (row) => {
    const listingId = listingIdFor(row.address, row.city);
    if (queuedIds.has(listingId)) return false;
    if (args.resume && hasHtmlSnapshot(listingId)) {
      shared.batchSkipped++;
      return false;
    }
    const radarId = resolveRadarId(row, radarIdByListing);
    if (!radarId) {
      shared.batchSkipped++;
      return false;
    }
    const seed = makeSeed({ ...row, radarId }, radarIdByListing);
    seed.radarId = radarId;
    queue.push(seed);
    queuedIds.add(listingId);
    return true;
  };

  const harvestFromStore = (storeRows) => {
    let added = 0;
    while (storeIndex < storeRows.length && queue.length < batchTarget) {
      rowsSeen++;
      if (tryAddRow(storeRows[storeIndex])) added++;
      storeIndex++;
    }
    saveHarvestIndex(storeIndex);
    return added;
  };

  heartbeat("harvesting");
  console.log("  → harvesting (scroll + Ext store)…");

  while (queue.length < batchTarget && !shared.stop) {
    heartbeat("harvesting");

    const storeData = await readAllStoreListings(page);
    const storeSize = storeData.rows.length;

    if (storeSize > 0) {
      const added = harvestFromStore(storeData.rows);
      if (added > 0) {
        console.log(`  → store ${storeSize} rows, +${added} queued (total ${queue.length})`);
      }
      if (storeSize > lastStoreSize) {
        stagnantNoStoreGrowth = 0;
        lastStoreSize = storeSize;
      } else if (storeIndex >= storeSize) {
        stagnantNoStoreGrowth++;
      }
    }

    if (queue.length >= batchTarget) break;

    let visible;
    try {
      visible = await readVisibleListRows(page);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`  → list read failed (${message}) — reopening list…`);
      await waitForListGrid(page, context, false);
      await sleep(1500);
      continue;
    }

    for (const row of visible) {
      if (queue.length >= batchTarget) break;
      if (seenRecordIds.has(row.recordId)) continue;
      seenRecordIds.add(row.recordId);
      rowsSeen++;
      tryAddRow(row);
    }

    if (queue.length >= batchTarget) break;

    const scroll = await scrollListDown(page);
    saveListScrollState(await readListScrollTop(page));
    await sleep(400);

    if (scroll.atEnd) {
      stagnantAtEnd++;
      if (stagnantAtEnd % 15 === 0) {
        console.log(
          `  → scrolling… (${seenRecordIds.size} DOM rows, ${queue.length} queued, store ${lastStoreSize} idx ${storeIndex})`,
        );
      }
      if (stagnantAtEnd >= 40 && stagnantNoStoreGrowth >= 20) {
        console.log(`  → end of list (${seenRecordIds.size} DOM rows, ${queue.length} queued)`);
        break;
      }
    } else {
      stagnantAtEnd = 0;
    }
  }

  const source = queue.length > 0 ? "scroll+store" : "none";
  return { queue, rowsSeen, source };
}

/** Phase 2: open each detail URL and save HTML — no return to list between listings. */
async function visitBatchQueue(page, args, shared, radarIdByListing, queue) {
  for (let i = 0; i < queue.length; i++) {
    if (shared.stop) break;

    const seed = queue[i];
    const label = `[batch ${shared.batchNum} ${i + 1}/${queue.length}]`;
    console.log(`${label} ${seed.address}, ${seed.city}`);
    console.log(`  → opening detail ${seed.radarId}…`);

    try {
      await openDetailPage(page, seed.radarId, { pauseMs: args.pauseMs, expandTabs: args.expandTabs });
      const result = await saveDetailHtmlFromPage(page, seed, seed.radarId, 0, args.htmlOnly);
      radarIdByListing.set(seed.listingId, result.radarId);

      await withStoreLock(async () => {
        const store = loadPilotStore();
        upsertPilotListing(store, result);
        savePilotStore(store);
      });

      if (result.scrapeStatus === "html_saved" || result.scrapeStatus === "ok") {
        shared.batchSaved++;
      } else {
        shared.batchErrors++;
        if (args.stopOnError) shared.stop = true;
      }

      console.log(`  → ${result.scrapeStatus}`);
      logProgress({
        ...shared.progressBase(),
        batchSaved: shared.batchSaved,
        batchSkipped: shared.batchSkipped,
        batchErrors: shared.batchErrors,
        totalSaved: countHtmlSnapshots(),
        lastAddress: seed.address,
        lastCity: seed.city,
        status: `${label} ${result.scrapeStatus}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await withStoreLock(async () => {
        const store = loadPilotStore();
        upsertPilotListing(store, {
          ...seed,
          scrapeStatus: "error",
          scrapeError: message,
          scrapedAt: new Date().toISOString(),
        });
        savePilotStore(store);
      });
      shared.batchErrors++;
      if (args.stopOnError) shared.stop = true;
      console.error(`${label} ERROR: ${message}`);
    }
  }
}

async function restoreListForNextHarvest(page, context) {
  console.log("  → back to list for next harvest…");
  await waitForListGrid(page, context, false);
  const savedScroll = loadListScrollState();
  if (savedScroll > 0) {
    await setListScrollTop(page, savedScroll);
    console.log(`  → continued at scroll ${savedScroll}px`);
    await sleep(600);
  }
}

/** Login once, visit detail URLs from list-harvest.json (no list scrolling). */
async function runFromHarvestSession(args, shared, radarIdByListing) {
  const browser = await chromium.launch({
    headless: false,
    slowMo: args.slowMo,
    args: ["--window-size=1440,900"],
  });
  const contextOptions = { viewport: { width: 1440, height: 900 } };
  if (fs.existsSync(SESSION_FILE)) contextOptions.storageState = SESSION_FILE;
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    await ensureLoggedIn(page, context);

    while (!shared.stop && countHtmlSnapshots() < args.goal) {
      shared.batchNum++;
      shared.batchSaved = 0;
      shared.batchErrors = 0;

      const batchTarget = Math.min(
        args.limit ?? args.batchSize,
        args.batchSize,
        Math.max(0, args.goal - countHtmlSnapshots()),
      );
      shared.batchTarget = batchTarget;
      if (batchTarget <= 0) break;

      console.log(`\n━━━ Batch ${shared.batchNum}: visit up to ${batchTarget} from harvest file ━━━\n`);

      const queue = buildQueueFromHarvest(
        { ...args, limit: batchTarget },
        shared,
        radarIdByListing,
      );

      if (queue.length === 0) {
        console.log("\nNo unsaved listings left in harvest file.");
        break;
      }

      await visitBatchQueue(page, args, shared, radarIdByListing, queue);

      const totalSaved = countHtmlSnapshots();
      console.log(
        `\nBatch ${shared.batchNum} done — saved ${shared.batchSaved}, skipped ${shared.batchSkipped}, errors ${shared.batchErrors}`,
      );
      console.log(formatProgressLine({ ...shared.progressBase(), totalSaved, status: "batch complete" }));
      console.log("");

      if (totalSaved >= args.goal) break;
      if (args.stopOnError && shared.batchErrors > 0) break;
      if (!args.autoContinue) break;
      if (args.limit != null) break;

      await sleep(2000);
    }
  } finally {
    await saveSession(context);
    await browser.close();
  }
}

/** One browser session: harvest → visit → repeat until goal or list end. */
async function runSession(args, shared, radarIdByListing) {
  const browser = await chromium.launch({
    headless: false,
    slowMo: args.slowMo,
    args: ["--window-size=1440,900"],
  });
  const contextOptions = { viewport: { width: 1440, height: 900 } };
  if (fs.existsSync(SESSION_FILE)) contextOptions.storageState = SESSION_FILE;
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    await ensureLoggedIn(page, context);
    let emptyHarvestRetries = 0;

    while (countHtmlSnapshots() < args.goal && !shared.stop) {
      shared.batchNum++;
      shared.batchSaved = 0;
      shared.batchSkipped = 0;
      shared.batchErrors = 0;

      const batchTarget = Math.min(
        args.limit ?? args.batchSize,
        args.batchSize,
        Math.max(0, args.goal - countHtmlSnapshots()),
      );
      shared.batchTarget = batchTarget;

      if (batchTarget <= 0) break;

      console.log(
        `\n━━━ Batch ${shared.batchNum}: harvest ${batchTarget} links → visit each (up to ${batchTarget}) ━━━\n`,
      );

      const { queue, rowsSeen, source } = await harvestBatchQueue(
        page,
        context,
        args,
        shared,
        radarIdByListing,
        batchTarget,
      );

      console.log(`  → queue ready: ${queue.length} listings (via ${source ?? "scroll"})\n`);

      if (queue.length === 0) {
        const total = countHtmlSnapshots();
        if (total >= args.goal) break;

        if (loadListScrollState() > 0 && emptyHarvestRetries < 2) {
          emptyHarvestRetries++;
          console.log(
            `\nNo queue at saved scroll — resetting to top and retrying (${emptyHarvestRetries}/2)…`,
          );
          saveHarvestIndex(0);
          await waitForListGrid(page, context, false);
          await resetListToTop(page);
          shared.batchNum--;
          await sleep(2000);
          continue;
        }

        console.log(`\nNo new listings found (${rowsSeen} rows scanned).`);
        break;
      }

      emptyHarvestRetries = 0;

      await visitBatchQueue(page, args, shared, radarIdByListing, queue);

      const totalSaved = countHtmlSnapshots();
      console.log(
        `\nBatch ${shared.batchNum} done — saved ${shared.batchSaved}, skipped ${shared.batchSkipped}, errors ${shared.batchErrors}`,
      );
      console.log(formatProgressLine({ ...shared.progressBase(), totalSaved, status: "batch complete" }));
      console.log("");

      if (totalSaved >= args.goal) break;
      if (args.stopOnError && shared.batchErrors > 0) break;
      if (!args.autoContinue) break;
      if (args.limit != null) break;

      await restoreListForNextHarvest(page, context);
      await sleep(2000);
    }
  } finally {
    await saveSession(context);
    await browser.close();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.workers > 1) {
    console.warn("PropertyRadar allows only one login — using 1 browser window.");
    args.workers = 1;
  }
  if (args.fromHarvest && fs.existsSync(HARVEST_FILE)) {
    try {
      const harvest = JSON.parse(fs.readFileSync(HARVEST_FILE, "utf8"));
      const n = harvest.count ?? harvest.listings?.length;
      if (n) args.goal = n;
    } catch {
      // keep CLI goal
    }
  }
  ensurePilotDirs();

  const store = loadPilotStore();
  store.scrapedAt = new Date().toISOString();
  savePilotStore(store);

  const radarIdByListing = new Map(
    store.listings.filter((l) => l.radarId).map((l) => [l.listingId, l.radarId]),
  );
  for (const [id, radarId] of loadHarvestRadarIds()) {
    if (!radarIdByListing.has(id)) radarIdByListing.set(id, radarId);
  }

  const mode = args.htmlOnly ? "HTML snapshots only" : "HTML + extract images";
  const startingTotal = countHtmlSnapshots();
  const source = args.fromHarvest ? "harvest file → direct detail URLs" : "harvest queue → visit details";

  console.log(`PropertyRadar bulk scrape — ${mode}`);
  console.log(`Mode: ${source} | Goal: ${args.goal} | Batch: ${args.batchSize}`);
  console.log(`Workers: 1 browser window | Resume: ${args.resume ? "on" : "off"}`);
  console.log(`Auto-continue batches: ${args.autoContinue ? "on" : "off"} | Stop on error: ${args.stopOnError ? "on" : "off"}`);
  console.log(`Starting HTML snapshots: ${startingTotal}`);
  console.log(`Progress file: ${path.join(PILOT_ROOT, "progress.json")}\n`);

  writeProgress({
    totalSaved: startingTotal,
    goal: args.goal,
    batchNum: 0,
    batchSaved: 0,
    batchSkipped: 0,
    batchErrors: 0,
    batchSize: args.batchSize,
    workers: args.workers,
    status: "starting",
  });

  const shared = {
    batchNum: 0,
    batchSaved: 0,
    batchSkipped: 0,
    batchErrors: 0,
    batchTarget: 0,
    stop: false,
    progressBase() {
      return {
        totalSaved: countHtmlSnapshots(),
        goal: args.goal,
        batchNum: shared.batchNum,
        batchSaved: shared.batchSaved,
        batchSkipped: shared.batchSkipped,
        batchErrors: shared.batchErrors,
        batchSize: args.batchSize,
        batchTarget: shared.batchTarget,
        workers: args.workers,
      };
    },
  };

  if (args.fromHarvest) {
    await runFromHarvestSession(args, shared, radarIdByListing);
  } else {
    await runSession(args, shared, radarIdByListing);
  }

  const finalTotal = countHtmlSnapshots();
  writeProgress({
    totalSaved: finalTotal,
    goal: args.goal,
    batchNum: shared.batchNum,
    batchSaved: shared.batchSaved,
    batchSkipped: shared.batchSkipped,
    batchErrors: shared.batchErrors,
    batchSize: args.batchSize,
    workers: args.workers,
    status: "finished",
  });

  console.log(`\nFinal: ${finalTotal} / ${args.goal} HTML snapshots`);
  console.log(`HTML folder: ${HTML_DEBUG_DIR}`);
  console.log(`Run extract later: pnpm extract-propertyradar-html`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
