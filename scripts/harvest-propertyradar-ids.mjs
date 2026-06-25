#!/usr/bin/env node
/**
 * Scroll the live PropertyRadar list and save radar IDs to list-harvest.json.
 *
 * Usage:
 *   pnpm harvest-propertyradar-ids              # collect 100 new IDs (test)
 *   pnpm harvest-propertyradar-ids -- --limit 500
 *   pnpm harvest-propertyradar-ids -- --all      # scroll until end of list
 *   pnpm harvest-propertyradar-ids -- --fresh    # scroll from top, ignore saved scroll
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { listingIdFor } from "./lib/parse-propertyradar-export-html.mjs";
import { PILOT_ROOT, ensurePilotDirs } from "./lib/propertyradar-pilot-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIST_URL = "https://app.propertyradar.com/#!/myLists/List%20to%20be%20exported";
const SESSION_FILE = path.join(PILOT_ROOT, "session.json");
const HARVEST_FILE = path.join(PILOT_ROOT, "list-harvest.json");
const SCROLL_STATE_FILE = path.join(PILOT_ROOT, "list-scroll.json");
const PROGRESS_FILE = path.join(PILOT_ROOT, "harvest-progress.json");
const LIST_GOAL = Number(process.env.HARVEST_GOAL) || 9000;
const MAX_TIMEOUT = 40_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const args = { limit: 100, all: false, fresh: false, slowMo: 150 };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--fresh") args.fresh = true;
    else if (arg === "--all") args.all = true;
    else if (arg === "--limit") args.limit = Number(argv[++i]);
  }
  if (args.all) args.limit = Infinity;
  return args;
}

function writeHarvestProgress(patch) {
  ensurePilotDirs();
  let prev = {};
  try {
    if (fs.existsSync(PROGRESS_FILE)) prev = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    /* ignore */
  }
  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify({ ...prev, ...patch, updatedAt: new Date().toISOString() }, null, 2),
  );
}

function loadHarvest() {
  if (!fs.existsSync(HARVEST_FILE)) {
    return { harvestedAt: null, count: 0, listings: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(HARVEST_FILE, "utf8"));
  } catch {
    return { harvestedAt: null, count: 0, listings: [] };
  }
}

function saveHarvest(data) {
  ensurePilotDirs();
  data.count = data.listings.length;
  data.harvestedAt = new Date().toISOString();
  fs.writeFileSync(HARVEST_FILE, JSON.stringify(data, null, 2));
}

function loadScrollTop() {
  try {
    return Number(JSON.parse(fs.readFileSync(SCROLL_STATE_FILE, "utf8")).scrollTop) || 0;
  } catch {
    return 0;
  }
}

function saveScrollTop(scrollTop) {
  ensurePilotDirs();
  fs.writeFileSync(
    SCROLL_STATE_FILE,
    JSON.stringify({ scrollTop, updatedAt: new Date().toISOString() }, null, 2),
  );
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
      fs.writeFileSync(SESSION_FILE, JSON.stringify(await context.storageState(), null, 2));
      console.log("Logged in.\n");
    } else {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (await isAppReady(page)) break;
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

async function setScrollTop(page, scrollTop) {
  await page.evaluate((top) => {
    const g =
      document.querySelector(".x-grid-view .x-scroller") ??
      document.querySelector(".x-grid-view");
    if (g) g.scrollTop = top;
  }, scrollTop);
}

async function resetToTop(page) {
  await page.locator(".x-grid-view").first().click({ timeout: 5000 }).catch(() => {});
  await page.keyboard.press("Home");
  await sleep(600);
  saveScrollTop(0);
}

async function scrollDown(page) {
  return page.evaluate(() => {
    const g =
      document.querySelector(".x-grid-view .x-scroller") ??
      document.querySelector(".x-grid-view") ??
      document.querySelector(".x-scroller");
    if (!g) return { atEnd: true };
    const before = g.scrollTop;
    g.scrollTop += Math.max(200, Math.floor(g.clientHeight * 0.85));
    const atEnd = g.scrollTop <= before || g.scrollTop >= g.scrollHeight - g.clientHeight - 2;
    return { atEnd, scrollTop: g.scrollTop };
  });
}

async function readStoreRows(page) {
  return page.evaluate(() => {
    const rows = [];
    if (typeof Ext === "undefined") return rows;
    for (const grid of Ext.ComponentQuery.query("gridpanel, grid")) {
      const store = grid.getStore?.();
      if (!store?.getCount?.()) continue;
      for (let i = 0; i < store.getCount(); i++) {
        const d = store.getAt(i)?.data ?? {};
        const address = String(d.Address ?? d.address ?? "").trim();
        const city = String(d.City ?? d.city ?? "").trim();
        const radarId = d.RadarID ?? d.RadarId ?? d.radarId ?? null;
        if (address && city) rows.push({ address, city, radarId, storeIndex: i });
      }
      if (rows.length) return rows;
    }
    return rows;
  });
}

async function readDomRows(page) {
  return page.evaluate(() => {
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

function addRow(harvest, known, row, source) {
  const listingId = listingIdFor(row.address, row.city);
  if (known.has(listingId)) return 0;
  if (!row.radarId) return 0;

  known.add(listingId);
  harvest.listings.push({
    storeIndex: row.storeIndex ?? harvest.listings.length,
    radarId: row.radarId,
    listingId,
    address: row.address,
    city: row.city,
    seedSource: source,
  });
  return 1;
}

async function main() {
  const args = parseArgs(process.argv);
  ensurePilotDirs();

  const harvest = loadHarvest();
  const known = new Set(harvest.listings.map((l) => l.listingId));
  const startCount = harvest.listings.filter((l) => l.radarId).length;
  let addedThisRun = 0;

  const targetLabel = args.all ? `all (~${LIST_GOAL} on list)` : `${args.limit} new this run`;
  console.log(`Harvest radar IDs — target: ${targetLabel}`);
  console.log(`Already in file: ${startCount} with radar ID`);
  console.log(`Output: ${HARVEST_FILE}\n`);

  writeHarvestProgress({
    status: "starting",
    goal: LIST_GOAL,
    runTarget: args.all ? "all" : args.limit,
    totalWithRadarId: startCount,
    addedThisRun: 0,
    scrollTop: args.fresh ? 0 : loadScrollTop(),
  });

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
    await waitForListGrid(page, context);

    if (args.fresh) {
      await resetToTop(page);
      console.log("  → starting from top of list");
    } else {
      const scrollTop = loadScrollTop();
      if (scrollTop > 0) {
        await setScrollTop(page, scrollTop);
        console.log(`  → resumed scroll at ${scrollTop}px`);
      } else {
        await resetToTop(page);
        console.log("  → starting from top of list");
      }
    }

    let stagnantAtEnd = 0;
    let lastStoreSize = 0;
    let loops = 0;
    let skippedNoRadarId = 0;
    let lastSaved = null;

    writeHarvestProgress({ status: "scrolling", totalWithRadarId: harvest.listings.filter((l) => l.radarId).length });

    while (addedThisRun < args.limit) {
      loops++;
      const storeRows = await readStoreRows(page);
      const domRows = await readDomRows(page);

      let addedNow = 0;
      for (const row of storeRows) {
        const listingId = listingIdFor(row.address, row.city);
        if (!known.has(listingId) && !row.radarId) skippedNoRadarId++;
        addedNow += addRow(harvest, known, row, "live-list-store");
        if (Number.isFinite(args.limit) && addedThisRun + addedNow >= args.limit) break;
      }
      for (const row of domRows) {
        if (Number.isFinite(args.limit) && addedThisRun + addedNow >= args.limit) break;
        const listingId = listingIdFor(row.address, row.city);
        if (!known.has(listingId) && !row.radarId) skippedNoRadarId++;
        addedNow += addRow(harvest, known, row, "live-list-dom");
      }

      const scrollTop = await page.evaluate(() => {
        const g =
          document.querySelector(".x-grid-view .x-scroller") ??
          document.querySelector(".x-grid-view");
        return g?.scrollTop ?? 0;
      });

      if (addedNow > 0) {
        addedThisRun += addedNow;
        const last = harvest.listings[harvest.listings.length - 1];
        lastSaved = last ? { address: last.address, city: last.city } : null;
        saveHarvest(harvest);
        saveScrollTop(scrollTop);
        const runLabel = args.all ? String(addedThisRun) : `${addedThisRun}/${args.limit}`;
        console.log(
          `  +${addedNow} saved (this run: ${runLabel}, total: ${harvest.listings.length}, store: ${storeRows.length} rows)`,
        );
        stagnantAtEnd = 0;
      }

      writeHarvestProgress({
        status: "scrolling",
        totalWithRadarId: harvest.listings.filter((l) => l.radarId).length,
        addedThisRun,
        scrollTop,
        storeRows: storeRows.length,
        skippedNoRadarId,
        stagnantPasses: stagnantAtEnd,
        lastAddress: lastSaved?.address ?? null,
        lastCity: lastSaved?.city ?? null,
      });

      if (addedThisRun >= args.limit) break;

      if (storeRows.length > lastStoreSize) {
        lastStoreSize = storeRows.length;
        stagnantAtEnd = 0;
      }

      const scroll = await scrollDown(page);
      saveScrollTop(scroll.scrollTop ?? 0);
      await sleep(400);

      if (scroll.atEnd) {
        stagnantAtEnd++;
        if (stagnantAtEnd % 5 === 0) {
          console.log(
            `  → scrolling… (total saved: ${harvest.listings.length}, store: ${storeRows.length}, at list end pass ${stagnantAtEnd})`,
          );
        }
        if (stagnantAtEnd >= 15) {
          console.log("  → reached end of list");
          break;
        }
      } else {
        stagnantAtEnd = 0;
      }

      if (loops % 20 === 0) {
        const runLabel = args.all ? String(addedThisRun) : `${addedThisRun}/${args.limit}`;
        console.log(`  … scrolling (this run: ${runLabel}, total: ${harvest.listings.length})`);
      }
    }

    saveHarvest(harvest);
    fs.writeFileSync(SESSION_FILE, JSON.stringify(await context.storageState(), null, 2));

    const withRadar = harvest.listings.filter((l) => l.radarId).length;
    writeHarvestProgress({
      status: "done",
      totalWithRadarId: withRadar,
      addedThisRun,
      skippedNoRadarId,
    });
    console.log(`\nDone — added ${addedThisRun} this run`);
    console.log(`Total in ${HARVEST_FILE}: ${harvest.listings.length} (${withRadar} with radar ID)`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
