/**
 * PropertyRadar HTML → Supabase batch upload helpers.
 */
import fs from "fs";
import path from "path";
import { parsePropertyRadarDetailHtmlFile } from "./parse-propertyradar-detail-html.mjs";
import { parseOverviewAddress } from "./propertyradar-local-db.mjs";
import { PILOT_IMAGES, PILOT_ROOT } from "./propertyradar-pilot-store.mjs";

export const UPLOAD_PROGRESS_FILE = path.join(PILOT_ROOT, "upload-progress.json");
export const HARVEST_FILE = path.join(PILOT_ROOT, "list-harvest.json");
export const SNAPSHOT_DIR = path.join(PILOT_ROOT, "html-snapshots");

/** Stable per-listing key — matches xlsx import; avoids radarId collisions in DB. */
export function propertyRadarExternalId(listingId) {
  return String(listingId).replace(/^propertyradar-/, "");
}

export function writeUploadProgress(state) {
  fs.mkdirSync(PILOT_ROOT, { recursive: true });
  fs.writeFileSync(
    UPLOAD_PROGRESS_FILE,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2),
  );
}

export function readUploadProgress() {
  try {
    return JSON.parse(fs.readFileSync(UPLOAD_PROGRESS_FILE, "utf8"));
  } catch {
    return null;
  }
}

export async function ensurePublicPhoto(root, listingId, overviewPhotoUrl) {
  const publicDir = path.join(root, "public", "listings", "propertyradar");
  fs.mkdirSync(publicDir, { recursive: true });
  const dest = path.join(publicDir, `${listingId}.jpg`);
  const publicUrl = `/listings/propertyradar/${listingId}.jpg`;

  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    return publicUrl;
  }

  const localPilot = path.join(PILOT_IMAGES, `${listingId}.jpg`);
  if (fs.existsSync(localPilot)) {
    fs.copyFileSync(localPilot, dest);
    return publicUrl;
  }

  if (!overviewPhotoUrl) return null;

  const res = await fetch(overviewPhotoUrl, {
    headers: { "User-Agent": "REOVANA-propertyradar-upload/1.0" },
  });
  if (!res.ok) return null;
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return publicUrl;
}

export function extractListingFromHarvestSeed(root, seed, importSource) {
  const htmlPath = path.join(SNAPSHOT_DIR, `${seed.listingId}.html`);
  if (!fs.existsSync(htmlPath)) return { error: "no_html", seed };

  const parsed = parsePropertyRadarDetailHtmlFile(htmlPath);
  const addr = parseOverviewAddress(parsed.address, seed.city);
  const radarId = parsed.radarId ?? seed.radarId ?? null;

  return {
    raw: {
      id: seed.listingId,
      externalId: propertyRadarExternalId(seed.listingId),
      radarId,
      address: addr.street || parsed.address || seed.address,
      city: addr.city || seed.city,
      state: addr.state,
      zip: addr.zip,
      propertyType: parsed.propertyType,
      squareFootage: parsed.squareFootage ?? 0,
      bedrooms: parsed.bedrooms ?? 0,
      bathrooms: parsed.bathrooms ?? 0,
      yearBuilt: parsed.yearBuilt,
      lotSize: parsed.lotSize,
      estValue: parsed.estValue ?? 0,
      estEquity: parsed.estEquity,
      distressScore: parsed.distressScore,
      overviewPhotoUrl: parsed.overviewPhotoUrl,
      detailUrl: radarId
        ? `https://app.propertyradar.com/#!/discover/detail/${radarId}`
        : null,
      htmlSnapshotPath: path.relative(root, htmlPath),
      importSource,
    },
    seed,
  };
}

export function mapRawToSyncListing(raw, imageUrl) {
  return { ...raw, imageUrl };
}
