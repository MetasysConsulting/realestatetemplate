/**
 * Scrapes HUD HomeStore listings by state.
 * Source: https://www.hudhomestore.gov/
 *
 * Listings are embedded as JSON in search result pages (#available_prop).
 * Dedupes by HUD case number, upserts into Supabase (no duplicate rows).
 * Re-run periodically: pnpm scrape-hud
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { syncHudListingsToDatabase } from "./lib/listings-db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE_URL = "https://www.hudhomestore.gov";
const OUT_JSON = path.join(ROOT, "src/data/hud-listings.json");

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WV", "WI", "WY",
];

const DELAY_MS = 350;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractListings(html) {
  const match = html.match(/id="available_prop"\s+value="([^"]+)"/);
  if (!match) return [];

  try {
    const json = decodeHtmlEntities(match[1]);
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeListing(raw) {
  const caseNumber = raw.propertyCaseNumber?.trim() ?? "";
  const listPrice = parseInt(String(raw.listPrice ?? "0").replace(/,/g, ""), 10) || 0;

  return {
    id: `hud-${caseNumber}`,
    caseNumber,
    address: raw.propertyAddress?.trim() ?? "",
    city: raw.propertyCity?.trim() ?? "",
    state: raw.propertyState?.trim() ?? "",
    zip: raw.propertyZip?.trim() ?? "",
    county: raw.propertyCounty?.trim() ?? "",
    listPrice,
    bedrooms: parseInt(raw.bedrooms ?? "0", 10) || 0,
    bathrooms: parseFloat(raw.bathroomsdecimal ?? raw.bathrooms ?? "0") || 0,
    squareFootage: parseInt(String(raw.squareFootage ?? "0").replace(/,/g, ""), 10) || 0,
    yearBuilt: raw.yearBuilt?.trim() ?? "",
    propertyType: raw.propertyType?.trim() ?? "",
    listingPeriod: raw.listingPeriod?.trim() ?? "",
    propertyStatus: raw.propertyStatus?.trim() || raw.propertyStatusDesc?.trim() || "Active",
    listDate: raw.listDate?.trim() ?? "",
    bidOpenDate: raw.bidOpenDate?.trim() ?? "",
    periodDeadlineDate: raw.periodDeadlineDate?.trim() ?? "",
    fhaFinancing: raw.fhaFinancing?.trim() ?? "",
    eligibleBidders: raw.eligibleBidders?.trim() ?? "",
    lat: parseFloat(raw.latitude) || 0,
    lng: parseFloat(raw.longitude) || 0,
    imageUrl: raw.propertyThumb?.trim() || null,
    detailUrl: `${BASE_URL}/PropertyDetails?caseNumber=${encodeURIComponent(caseNumber)}`,
    sourceUrl: BASE_URL,
    sourceAgency: "U.S. Department of Housing and Urban Development",
  };
}

async function fetchStateListings(state) {
  const url = `${BASE_URL}/searchresult?citystate=${state}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "REOVANA-DataSync/1.0 (public HUD listing aggregator)",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${state}`);
  }

  const html = await res.text();
  return extractListings(html);
}

async function main() {
  console.log("Fetching HUD HomeStore listings by state…");
  const byCase = new Map();
  const stateCounts = {};

  for (const state of US_STATES) {
    try {
      const rawListings = await fetchStateListings(state);
      stateCounts[state] = rawListings.length;

      for (const raw of rawListings) {
        const normalized = normalizeListing(raw);
        if (normalized.caseNumber) {
          byCase.set(normalized.caseNumber, normalized);
        }
      }

      console.log(`  ${state}: ${rawListings.length} listings`);
    } catch (err) {
      console.warn(`  ${state}: failed — ${err.message}`);
      stateCounts[state] = 0;
    }

    await sleep(DELAY_MS);
  }

  const listings = [...byCase.values()].sort((a, b) => b.listPrice - a.listPrice);

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

  if (process.env.SYNC_SUPABASE === "0") {
    console.log("⊘ Skipped Supabase sync (SYNC_SUPABASE=0)");
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.log("⊘ Skipped Supabase sync — set DATABASE_URL in .env.local to enable");
    return;
  }

  try {
    console.log("Syncing to Supabase (upsert + deactivate stale)…");
    const sync = await syncHudListingsToDatabase(listings, {
      scrapedAt: payload.scrapedAt,
      sourceUrl: BASE_URL,
    });
    console.log(
      `✓ Supabase: ${sync.upserted} upserted, ${sync.deactivated} marked inactive (sold/removed from HUD)`,
    );
  } catch (err) {
    console.error(`✗ Supabase sync failed: ${err.message}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
