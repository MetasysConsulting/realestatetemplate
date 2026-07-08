#!/usr/bin/env node
/**
 * Step 2: Extract property photo + fields from saved HTML snapshots.
 * Run after scrape-propertyradar-images-pilot.mjs saves html-snapshots/.
 *
 * Usage:
 *   pnpm extract-propertyradar-html
 *   pnpm extract-propertyradar-html -- path/to/snapshot.html
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parsePropertyRadarDetailHtmlFile } from "./lib/parse-propertyradar-detail-html.mjs";
import {
  PILOT_IMAGES,
  PILOT_JSON,
  PILOT_ROOT,
  ensurePilotDirs,
  loadPilotStore,
  savePilotStore,
  upsertPilotListing,
} from "./lib/propertyradar-pilot-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SNAPSHOT_DIR = path.join(PILOT_ROOT, "html-snapshots");

async function downloadImage(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": "REOVANA-html-extract/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

async function processSnapshot(filePath, store) {
  const listingId = path.basename(filePath, ".html");
  const parsed = parsePropertyRadarDetailHtmlFile(filePath);
  const existing = store.listings.find((l) => l.listingId === listingId) ?? { listingId };

  let localImagePath = null;
  let imageUrl = parsed.overviewPhotoUrl;

  if (imageUrl) {
    const ext = imageUrl.includes(".jpeg") || imageUrl.includes(".jpg") ? ".jpg" : ".jpg";
    const destPath = path.join(PILOT_IMAGES, `${listingId}${ext}`);
    try {
      await downloadImage(imageUrl, destPath);
      localImagePath = path.relative(ROOT, destPath);
    } catch (error) {
      console.warn(`  download failed: ${error.message}`);
    }
  }

  const result = {
    ...existing,
    listingId,
    radarId: parsed.radarId ?? existing.radarId,
    address: parsed.address ?? existing.address,
    city: existing.city,
    propertyType: parsed.propertyType ?? existing.propertyType,
    bedrooms: parsed.bedrooms ?? existing.bedrooms,
    bathrooms: parsed.bathrooms ?? existing.bathrooms,
    yearBuilt: parsed.yearBuilt ?? existing.yearBuilt,
    squareFootage: parsed.squareFootage ?? existing.squareFootage,
    estValue: parsed.estValue ?? existing.estValue,
    estEquity: parsed.estEquity ?? existing.estEquity,
    lotSize: parsed.lotSize ?? existing.lotSize,
    distressScore: parsed.distressScore ?? existing.distressScore,
    imageUrl,
    imageSource: imageUrl ? "overview-aerial-html" : null,
    localImagePath,
    htmlSnapshot: path.relative(ROOT, filePath),
    scrapeStatus: imageUrl && localImagePath ? "ok" : imageUrl ? "image_download_failed" : "no_photo_in_html",
    extractedAt: new Date().toISOString(),
  };

  upsertPilotListing(store, result);
  return result;
}

async function main() {
  ensurePilotDirs();
  const store = loadPilotStore();

  const files = process.argv[2] && !process.argv[2].startsWith("--")
    ? [path.resolve(process.argv[2])]
    : fs.readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith(".html") && !f.startsWith("._")).map((f) => path.join(SNAPSHOT_DIR, f));

  if (!files.length) {
    console.log("No HTML snapshots found. Run the visible scraper first.");
    process.exit(0);
  }

  console.log(`Extracting from ${files.length} HTML snapshot(s)…\n`);

  for (const file of files.sort()) {
    const name = path.basename(file);
    console.log(name);
    const result = await processSnapshot(file, store);
    console.log(`  → ${result.scrapeStatus}${result.imageUrl ? `\n     photo: ${result.imageUrl.slice(0, 90)}…` : ""}`);
    if (result.address) console.log(`     address: ${result.address}`);
    if (result.radarId) console.log(`     radar: ${result.radarId}`);
  }

  savePilotStore(store);
  console.log(`\nUpdated ${PILOT_JSON}`);
  console.log(`Images in ${PILOT_IMAGES}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
