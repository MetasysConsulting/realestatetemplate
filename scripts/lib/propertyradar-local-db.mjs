/**
 * Local SQLite store for PropertyRadar pilot listings (Node built-in sqlite).
 */
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";
import { PILOT_ROOT, ensurePilotDirs } from "./propertyradar-pilot-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PILOT_DB = path.join(PILOT_ROOT, "pilot.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS listings (
  listing_id TEXT PRIMARY KEY,
  radar_id TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  property_type TEXT,
  bedrooms REAL,
  bathrooms REAL,
  year_built TEXT,
  square_footage INTEGER,
  est_value INTEGER,
  est_equity INTEGER,
  lot_size INTEGER,
  distress_score INTEGER,
  image_url TEXT,
  local_image_path TEXT,
  html_snapshot_path TEXT,
  detail_url TEXT,
  has_photo INTEGER NOT NULL DEFAULT 0,
  extracted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_radar_id ON listings(radar_id);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
`;

export function openPilotDb(dbPath = PILOT_DB) {
  ensurePilotDirs();
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(SCHEMA);
  return db;
}

export function upsertPilotListingRow(db, row) {
  db.prepare(`
    INSERT INTO listings (
      listing_id, radar_id, address, city, state, zip, property_type,
      bedrooms, bathrooms, year_built, square_footage, est_value, est_equity,
      lot_size, distress_score, image_url, local_image_path, html_snapshot_path,
      detail_url, has_photo, extracted_at
    ) VALUES (
      @listing_id, @radar_id, @address, @city, @state, @zip, @property_type,
      @bedrooms, @bathrooms, @year_built, @square_footage, @est_value, @est_equity,
      @lot_size, @distress_score, @image_url, @local_image_path, @html_snapshot_path,
      @detail_url, @has_photo, @extracted_at
    )
    ON CONFLICT(listing_id) DO UPDATE SET
      radar_id=excluded.radar_id,
      address=excluded.address,
      city=excluded.city,
      state=excluded.state,
      zip=excluded.zip,
      property_type=excluded.property_type,
      bedrooms=excluded.bedrooms,
      bathrooms=excluded.bathrooms,
      year_built=excluded.year_built,
      square_footage=excluded.square_footage,
      est_value=excluded.est_value,
      est_equity=excluded.est_equity,
      lot_size=excluded.lot_size,
      distress_score=excluded.distress_score,
      image_url=excluded.image_url,
      local_image_path=excluded.local_image_path,
      html_snapshot_path=excluded.html_snapshot_path,
      detail_url=excluded.detail_url,
      has_photo=excluded.has_photo,
      extracted_at=excluded.extracted_at
  `).run(row);
}

export function pilotDbStats(db) {
  const total = db.prepare("SELECT COUNT(*) AS n FROM listings").get().n;
  const withPhoto = db.prepare("SELECT COUNT(*) AS n FROM listings WHERE has_photo = 1").get().n;
  const withValue = db.prepare("SELECT COUNT(*) AS n FROM listings WHERE est_value IS NOT NULL").get().n;
  return { total, withPhoto, withValue };
}

export function parseOverviewAddress(fullAddress, fallbackCity) {
  const parts = (fullAddress ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1].match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    return {
      street: parts.slice(0, -2).join(", ") || parts[0],
      city: parts[parts.length - 2] ?? fallbackCity ?? "",
      state: stateZip?.[1] ?? "",
      zip: stateZip?.[2] ?? "",
    };
  }
  return {
    street: fullAddress ?? "",
    city: fallbackCity ?? "",
    state: "",
    zip: "",
  };
}
