#!/usr/bin/env node
/**
 * Extract first N PropertyRadar listings from saved HTML + harvest file
 * into local SQLite (data/propertyradar-pilot/pilot.db) with photos.
 *
 * Usage:
 *   pnpm import-propertyradar-pilot-100
 *   pnpm import-propertyradar-pilot-100 -- --limit 100
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parsePropertyRadarDetailHtmlFile } from "./lib/parse-propertyradar-detail-html.mjs";
import {
  PILOT_DB,
  openPilotDb,
  parseOverviewAddress,
  pilotDbStats,
  upsertPilotListingRow,
} from "./lib/propertyradar-local-db.mjs";
import { PILOT_IMAGES, PILOT_ROOT, ensurePilotDirs } from "./lib/propertyradar-pilot-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HARVEST_FILE = path.join(PILOT_ROOT, "list-harvest.json");
const SNAPSHOT_DIR = path.join(PILOT_ROOT, "html-snapshots");

function parseLimit(argv) {
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--limit") return Number(argv[++i]);
  }
  return 100;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": "REOVANA-pilot-import/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const limit = parseLimit(process.argv);
  ensurePilotDirs();
  fs.mkdirSync(PILOT_IMAGES, { recursive: true });

  const harvest = JSON.parse(fs.readFileSync(HARVEST_FILE, "utf8"));
  const seeds = harvest.listings.slice(0, limit);
  const db = openPilotDb();

  console.log(`Importing first ${seeds.length} listings → ${PILOT_DB}\n`);

  let ok = 0;
  let photos = 0;
  let missingHtml = 0;

  for (const seed of seeds) {
    const htmlPath = path.join(SNAPSHOT_DIR, `${seed.listingId}.html`);
    if (!fs.existsSync(htmlPath)) {
      missingHtml++;
      console.log(`  skip (no html): ${seed.address}, ${seed.city}`);
      continue;
    }

    const parsed = parsePropertyRadarDetailHtmlFile(htmlPath);
    const addr = parseOverviewAddress(parsed.address, seed.city);
    const radarId = parsed.radarId ?? seed.radarId ?? null;
    const detailUrl = radarId
      ? `https://app.propertyradar.com/#!/discover/detail/${radarId}`
      : null;

    let localImagePath = null;
    const imageUrl = parsed.overviewPhotoUrl;
    if (imageUrl) {
      const destPath = path.join(PILOT_IMAGES, `${seed.listingId}.jpg`);
      try {
        if (!fs.existsSync(destPath)) await downloadImage(imageUrl, destPath);
        localImagePath = path.relative(ROOT, destPath);
        photos++;
      } catch (error) {
        console.warn(`  photo failed ${seed.listingId}: ${error.message}`);
      }
    }

    const row = {
      listing_id: seed.listingId,
      radar_id: radarId,
      address: addr.street || parsed.address || seed.address,
      city: addr.city || seed.city,
      state: addr.state,
      zip: addr.zip,
      property_type: parsed.propertyType,
      bedrooms: parsed.bedrooms,
      bathrooms: parsed.bathrooms,
      year_built: parsed.yearBuilt,
      square_footage: parsed.squareFootage,
      est_value: parsed.estValue,
      est_equity: parsed.estEquity,
      lot_size: parsed.lotSize,
      distress_score: parsed.distressScore,
      image_url: imageUrl,
      local_image_path: localImagePath,
      html_snapshot_path: path.relative(ROOT, htmlPath),
      detail_url: detailUrl,
      has_photo: localImagePath ? 1 : 0,
      extracted_at: new Date().toISOString(),
    };

    upsertPilotListingRow(db, row);
    ok++;
    console.log(
      `${ok}. ${row.address}, ${row.city}${row.state ? `, ${row.state}` : ""}` +
        ` | $${row.est_value?.toLocaleString() ?? "?"} | photo: ${localImagePath ? "yes" : "no"}`,
    );
  }

  const stats = pilotDbStats(db);
  db.close();

  console.log(`\nDone — ${ok} imported (${missingHtml} missing html)`);
  console.log(`Database: ${PILOT_DB}`);
  console.log(`Photos: ${photos}/${ok} saved under data/propertyradar-pilot/images/`);
  console.log(`Stats: ${stats.total} rows, ${stats.withPhoto} with photo, ${stats.withValue} with est. value`);
  console.log(`\nQuery example:`);
  console.log(`  sqlite3 "${PILOT_DB}" "SELECT address, city, est_value, local_image_path FROM listings LIMIT 5;"`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
