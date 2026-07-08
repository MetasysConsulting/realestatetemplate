/**
 * Local pilot store for PropertyRadar scrape results (no Supabase yet).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PILOT_ROOT = path.join(__dirname, "..", "..", "data", "propertyradar-pilot");
export const PILOT_JSON = path.join(PILOT_ROOT, "listings.json");
export const PILOT_IMAGES = path.join(PILOT_ROOT, "images");

export function ensurePilotDirs() {
  fs.mkdirSync(PILOT_IMAGES, { recursive: true });
}

export function loadPilotStore() {
  if (!fs.existsSync(PILOT_JSON)) {
    return { scrapedAt: null, sourceHtml: null, listings: [] };
  }
  return JSON.parse(fs.readFileSync(PILOT_JSON, "utf8"));
}

export function savePilotStore(store) {
  ensurePilotDirs();
  fs.writeFileSync(PILOT_JSON, JSON.stringify(store, null, 2));
}

export function upsertPilotListing(store, listing) {
  const idx = store.listings.findIndex((l) => l.listingId === listing.listingId);
  if (idx >= 0) {
    store.listings[idx] = { ...store.listings[idx], ...listing };
  } else {
    store.listings.push(listing);
  }
}

export async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "REOVANA-pilot-scraper/1.0" },
  });
  if (!res.ok) throw new Error(`Image download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  return destPath;
}
