/**
 * Scrapes USDA RD/FSA resale listings via county search POST.
 * Source: https://properties.sc.egov.usda.gov/resales/public/home
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE_URL = "https://properties.sc.egov.usda.gov";
const OUT_JSON = path.join(ROOT, "src/data/usda-resales.json");

const SEARCH_FORMS = [
  { name: "SFH", path: "searchSFH", label: "Single Family Housing" },
  { name: "MFH", path: "searchMFH", label: "Multi-Family Housing" },
  { name: "FSA", path: "searchFSA", label: "Farm & Ranch" },
];

const DELAY_MS = 400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseStateOptions(html) {
  const states = [];
  const re = /<option value="(\d+)"[^>]*>\s*([^<(]+)\s*\((\d+)\)/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    states.push({
      stateCode: match[1],
      stateName: match[2].trim(),
      count: parseInt(match[3], 10),
    });
  }
  return states;
}

function parseListings(html, meta) {
  const listings = [];
  const rowRe =
    /propertyDetail\?propertyId=(\d+)[^"']*">([\s\S]*?)<\/a>[\s\S]*?propertyAddress[^>]*>([^<]+)[\s\S]*?listPrice[^>]*>\$?([^<]+)/gi;

  let match;
  while ((match = rowRe.exec(html)) !== null) {
    listings.push({
      id: `usda-${meta.searchFormName}-${match[1]}`,
      propertyId: match[1],
      title: decodeHtml(match[2]).replace(/\s+/g, " ").trim(),
      address: decodeHtml(match[3]).replace(/\s+/g, " ").trim(),
      listPrice: parseInt(match[4].replace(/,/g, ""), 10) || 0,
      searchFormName: meta.searchFormName,
      propertyCategory: meta.label,
      stateCode: meta.stateCode,
      stateName: meta.stateName,
      countyCode: meta.countyCode,
      countyName: meta.countyName,
      detailUrl: `${BASE_URL}/resales/public/propertyDetail?propertyId=${match[1]}`,
      sourceUrl: BASE_URL,
      sourceAgency: "USDA Rural Development / FSA",
    });
  }

  return listings;
}

async function fetchText(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": "REOVANA-DataSync/1.0 (public USDA property aggregator)",
      Accept: "text/html,application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function fetchCounties(stateCode, searchFormName) {
  const url = `${BASE_URL}/resales/public/getCountiesOfStateWithActiveProperties?stateCode=${stateCode}&searchFormName=${searchFormName}`;
  const text = await fetchText(url);
  try {
    const counties = JSON.parse(text);
    return counties.map((c) => ({
      countyCode: c.countyCode,
      countyName: c.countyName?.replace(/\s*\(\d+\)\s*$/, "").trim() ?? "",
    }));
  } catch {
    return [];
  }
}

async function searchCounty(form, state, county) {
  const body = new URLSearchParams({
    stateCode: state.stateCode,
    countyCode: county.countyCode,
    listingType: "",
    searchFormName: form.name,
    propertyType: form.label.includes("Single")
      ? "Single Family"
      : form.label.includes("Multi")
        ? "Multi-Family"
        : "Farm & Ranch",
    Search: "Search",
  });

  const html = await fetchText(`${BASE_URL}/resales/public/${form.path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${BASE_URL}/resales/public/${form.path}`,
    },
    body: body.toString(),
  });

  return parseListings(html, {
    searchFormName: form.name,
    label: form.label,
    stateCode: state.stateCode,
    stateName: state.stateName,
    countyCode: county.countyCode,
    countyName: county.countyName,
  });
}

async function main() {
  console.log("Fetching USDA resale listings…");
  const byId = new Map();

  for (const form of SEARCH_FORMS) {
    const searchHtml = await fetchText(`${BASE_URL}/resales/public/${form.path}`);
    const states = parseStateOptions(searchHtml);
    console.log(`  ${form.label}: ${states.length} states with inventory`);

    for (const state of states) {
      const counties = await fetchCounties(state.stateCode, form.name);
      const targets = counties.length ? counties : [{ countyCode: "", countyName: "" }];

      for (const county of targets) {
        try {
          const listings = await searchCounty(form, state, county);
          for (const listing of listings) {
            byId.set(listing.id, listing);
          }
          if (listings.length) {
            console.log(
              `    ${state.stateName}${county.countyName ? ` / ${county.countyName}` : ""}: ${listings.length}`,
            );
          }
        } catch (err) {
          console.warn(`    ${state.stateName}: ${err.message}`);
        }
        await sleep(DELAY_MS);
      }
    }
  }

  const listings = [...byId.values()];
  const payload = {
    scrapedAt: new Date().toISOString(),
    sourceUrl: `${BASE_URL}/resales/public/home`,
    count: listings.length,
    listings,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2));
  console.log(`✓ Saved ${listings.length} USDA listings`);
  console.log(`✓ Wrote ${OUT_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
