#!/usr/bin/env node
/**
 * Upload PropertyRadar pilot-100 from local SQLite → Supabase.
 * Copies photos to public/listings/propertyradar/ for the site.
 *
 * Usage:
 *   pnpm upload-propertyradar-pilot-100
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { openPilotDb, PILOT_DB } from "./lib/propertyradar-local-db.mjs";
import { syncPropertyRadarListingsToDatabase, resolvePropertyRadarCategory } from "./lib/listings-db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC_IMAGES = path.join(ROOT, "public", "listings", "propertyradar");

function copyPhoto(localRelativePath, listingId) {
  if (!localRelativePath) return null;
  const src = path.join(ROOT, localRelativePath);
  if (!fs.existsSync(src)) return null;

  fs.mkdirSync(PUBLIC_IMAGES, { recursive: true });
  const destName = `${listingId}.jpg`;
  const dest = path.join(PUBLIC_IMAGES, destName);
  fs.copyFileSync(src, dest);
  return `/listings/propertyradar/${destName}`;
}

function mapPilotRow(row, publicImageUrl) {
  return {
    id: row.listing_id,
    externalId: row.radar_id ?? row.listing_id,
    radarId: row.radar_id,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    propertyType: row.property_type,
    squareFootage: row.square_footage ?? 0,
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    yearBuilt: row.year_built,
    lotSize: row.lot_size,
    estValue: row.est_value ?? 0,
    estEquity: row.est_equity,
    distressScore: row.distress_score,
    imageUrl: publicImageUrl,
    detailUrl: row.detail_url,
    htmlSnapshotPath: row.html_snapshot_path,
    importSource: "pilot-html-100",
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing — run with: node --env-file=.env.local scripts/upload-propertyradar-pilot-100.mjs");
  }

  const db = openPilotDb(PILOT_DB);
  const rows = db.prepare("SELECT * FROM listings ORDER BY listing_id").all();
  db.close();

  if (!rows.length) {
    throw new Error("No rows in pilot.db — run pnpm import-propertyradar-pilot-100 first");
  }

  const scrapedAt = new Date().toISOString();
  const listings = [];
  let photos = 0;

  for (const row of rows) {
    const imageUrl = copyPhoto(row.local_image_path, row.listing_id);
    if (imageUrl) photos++;
    listings.push(mapPilotRow(row, imageUrl));
  }

  const categoryCounts = {};
  for (const listing of listings) {
    const cat = resolvePropertyRadarCategory(listing);
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }

  console.log(`Uploading ${listings.length} pilot listings to Supabase (source: propertyradar)`);
  console.log(`Photos copied to public/: ${photos}/${listings.length}`);
  console.log("Categories:", categoryCounts);
  console.log(`metadata.importSource = "pilot-html-100" on all rows\n`);

  const result = await syncPropertyRadarListingsToDatabase(listings, {
    scrapedAt,
    sourceUrl: "https://app.propertyradar.com",
  });

  console.log("Sync complete:", result);
  console.log("\nOther propertyradar rows not in this batch were marked inactive.");
  console.log("Browse: /properties/motivated-seller, /properties/off-market, etc.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
