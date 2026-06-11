/**
 * Scrapes Freddie Mac HomeSteps REO listings.
 * Source: https://www.homesteps.com/
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE_URL = "https://www.homesteps.com";
const OUT_JSON = path.join(ROOT, "src/data/homesteps-listings.json");

const STATES = ["FL", "TX", "CA", "IL", "OH", "GA", "PA", "NY", "MI", "NC", "AZ", "VA", "MD", "TN", "SC"];
const MAX_PAGES_PER_STATE = 12;
const DELAY_MS = 400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

function parseAddress(full) {
  const match = full.match(/^(.+),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/);
  if (!match) {
    return { address: full, city: "", state: "", zip: "" };
  }
  return {
    address: match[1].trim(),
    city: match[2].trim(),
    state: match[3],
    zip: match[4],
  };
}

function parseSearchPage(html, state) {
  const listings = [];
  const geoByPath = new Map();

  const geoRe =
    /data-lat="([^"]+)"[^>]*data-lng="([^"]+)"[\s\S]*?href="(\/listingdetails\/[^"]+)"[\s\S]*?property-price[^>]*>\$?([^<]+)/g;
  let geoMatch;
  while ((geoMatch = geoRe.exec(html)) !== null) {
    geoByPath.set(geoMatch[3], {
      lat: parseFloat(geoMatch[1]),
      lng: parseFloat(geoMatch[2]),
      price: geoMatch[4].trim().replace(/,/g, ""),
    });
  }

  const paths = [];
  const pathRe = /href="(\/listingdetails\/[^"]+)"/g;
  let pathMatch;
  while ((pathMatch = pathRe.exec(html)) !== null) {
    if (!paths.includes(pathMatch[1])) paths.push(pathMatch[1]);
  }

  const addresses = [];
  const addrRe = /class="property-address"[^>]*>([\s\S]*?)<\/div>/g;
  let addrMatch;
  while ((addrMatch = addrRe.exec(html)) !== null) {
    addresses.push(decodeHtml(addrMatch[1]).replace(/\s+/g, " ").trim());
  }

  const images = [];
  const imgRe = /<img[^>]+src="(https:\/\/rbimages[^"]+)"/g;
  let imgMatch;
  while ((imgMatch = imgRe.exec(html)) !== null) {
    images.push(imgMatch[1]);
  }

  for (let i = 0; i < paths.length; i++) {
    const detailPath = paths[i];
    const fullAddress = addresses[i] ?? "";
    const geo = geoByPath.get(detailPath);
    const { address, city, listingState, zip } = (() => {
      const parsed = parseAddress(fullAddress);
      return {
        address: parsed.address,
        city: parsed.city,
        listingState: parsed.state || state,
        zip: parsed.zip,
      };
    })();

    const slug = detailPath.replace("/listingdetails/", "");
    listings.push({
      id: `homesteps-${slug}`,
      address,
      city,
      state: listingState,
      zip,
      listPrice: parseInt(geo?.price ?? "0", 10) || 0,
      lat: geo?.lat ?? 0,
      lng: geo?.lng ?? 0,
      imageUrl: images[i] ?? null,
      detailUrl: `${BASE_URL}${detailPath}`,
      sourceUrl: BASE_URL,
      sourceAgency: "Freddie Mac HomeSteps",
      searchState: state,
    });
  }

  return listings;
}

function totalCount(html) {
  const match = html.match(/>(\d+)\s+properties</i);
  return match ? parseInt(match[1], 10) : 0;
}

async function fetchStatePage(state, page) {
  const url = `${BASE_URL}/listing/search?search=${encodeURIComponent(state)}&page=${page}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "REOVANA-DataSync/1.0 (public REO listing aggregator)",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${state} page ${page}`);
  return res.text();
}

async function main() {
  console.log("Fetching HomeSteps listings by state…");
  const byId = new Map();
  const stateCounts = {};

  for (const state of STATES) {
    let stateTotal = 0;

    for (let page = 0; page < MAX_PAGES_PER_STATE; page++) {
      try {
        const html = await fetchStatePage(state, page);
        const listings = parseSearchPage(html, state);
        if (!listings.length) break;

        for (const listing of listings) {
          byId.set(listing.id, listing);
        }

        stateTotal += listings.length;
        const expected = totalCount(html);
        console.log(`  ${state} p${page}: ${listings.length} listings (${expected || "?"} total in state)`);

        if (expected && (page + 1) * 25 >= expected) break;
      } catch (err) {
        console.warn(`  ${state} p${page}: ${err.message}`);
        break;
      }

      await sleep(DELAY_MS);
    }

    stateCounts[state] = stateTotal;
  }

  const listings = [...byId.values()].sort((a, b) => b.listPrice - a.listPrice);
  const payload = {
    scrapedAt: new Date().toISOString(),
    sourceUrl: BASE_URL,
    count: listings.length,
    stateCounts,
    listings,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2));

  const withImages = listings.filter((l) => l.imageUrl).length;
  console.log(`✓ Saved ${listings.length} unique listings (${withImages} with photos)`);
  console.log(`✓ Wrote ${OUT_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
