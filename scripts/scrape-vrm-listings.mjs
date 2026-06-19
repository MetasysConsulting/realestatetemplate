/**
 * Scrapes VA REO listings from VRM Properties.
 * Source: https://www.vrmproperties.com/
 *
 * Dedupes by asset id, upserts into Supabase under source_id "vrm".
 * Re-run periodically: pnpm scrape-vrm
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { syncVrmListingsToDatabase } from "./lib/listings-db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE_URL = "https://www.vrmproperties.com";
const OUT_JSON = path.join(ROOT, "src/data/vrm-listings.json");

const DELAY_MS = 350;
const PAGE_CAP = 200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function titleCase(value) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bUsa\b/g, "USA");
}

function slugify(address, city, state, zip) {
  const raw = `${address}-${city}-${state}-${zip}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return raw;
}

function parseModelJson(html) {
  const match = html.match(/propertySearchResultsModelJson\s*=\s*(\{[\s\S]*?\})\s*;\s*<\/script>/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

function normalizeProperty(raw) {
  const address = titleCase((raw.addressLine1 ?? "").trim());
  const city = titleCase((raw.city ?? "").trim());
  const state = (raw.state ?? "").trim().toUpperCase();
  const zip = (raw.zip ?? "").trim();
  const slug = slugify(raw.addressLine1 ?? "", raw.city ?? "", state, zip);

  return {
    id: `vrm-${raw.assetId}`,
    propertyId: String(raw.assetId),
    address,
    city,
    state,
    zip,
    county: titleCase((raw.county ?? "").trim()),
    listPrice: Math.round(raw.displayPrice ?? raw.listPrice ?? 0),
    bedrooms: raw.bedrooms ?? 0,
    bathrooms: raw.bathrooms ?? 0,
    squareFootage: raw.squareFootage ?? 0,
    lotSize: raw.lotSize ?? 0,
    status: raw.assetListingStatus ?? "For Sale",
    propertyType:
      typeof raw.propertyType === "string" && raw.propertyType.trim()
        ? raw.propertyType.trim()
        : "VA REO",
    isNew: Boolean(raw.isNewListing),
    isVendeeFinancing: Boolean(raw.isVendeeFinancing),
    imageUrl: raw.mediaGuid ? `https://media.vrmproperties.com/media/${raw.mediaGuid}` : null,
    detailUrl: `${BASE_URL}/Property-For-Sale/${raw.assetId}/${slug}`,
    sourceUrl: BASE_URL,
    sourceAgency: "VRM Properties (VA REO)",
  };
}

async function fetchPage(page) {
  const url = `${BASE_URL}/Properties-For-Sale?currentPage=${page}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "REOVANA-DataSync/1.0 (public VA REO listing aggregator)",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for page ${page}`);
  return res.text();
}

async function main() {
  console.log("Fetching VRM Properties listings…");
  const byId = new Map();
  let totalPages = PAGE_CAP;

  for (let page = 1; page <= totalPages; page++) {
    try {
      const html = await fetchPage(page);
      const model = parseModelJson(html);
      if (!model?.properties?.length) {
        console.log(`  page ${page}: no listings — stopping`);
        break;
      }

      for (const raw of model.properties) {
        const listing = normalizeProperty(raw);
        byId.set(listing.id, listing);
      }

      console.log(
        `  page ${page}/${model.totalPages ?? "?"}: ${model.properties.length} listings (${model.count ?? "?"} total)`,
      );

      if (model.totalPages) totalPages = Math.min(model.totalPages, PAGE_CAP);
      if (model.totalPages && page >= model.totalPages) break;
    } catch (err) {
      console.warn(`  page ${page}: ${err.message}`);
      break;
    }

    await sleep(DELAY_MS);
  }

  const listings = [...byId.values()].sort((a, b) => b.listPrice - a.listPrice);
  const payload = {
    scrapedAt: new Date().toISOString(),
    sourceUrl: BASE_URL,
    count: listings.length,
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
    const sync = await syncVrmListingsToDatabase(listings, {
      scrapedAt: payload.scrapedAt,
      sourceUrl: BASE_URL,
    });
    console.log(
      `✓ Supabase: ${sync.upserted} upserted, ${sync.deactivated} marked inactive (removed from VRM)`,
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
