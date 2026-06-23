/**
 * Build src/data/propertyradar-listings.json from the PropertyRadar Excel export.
 * Usage: node scripts/export-propertyradar-json.mjs [path-to-xlsx]
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import allCities from "all-the-cities";
import XLSX from "xlsx";
import { mapPropertyRadarListingToRow, resolvePropertyRadarCategory } from "./lib/listings-db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEFAULT_XLSX = path.join(ROOT, "..", "Export-20260618-082223.xlsx");
const OUTPUT = path.join(ROOT, "src", "data", "propertyradar-listings.json");

const cityStateIndex = buildCityStateIndex(allCities);

function buildCityStateIndex(cities) {
  const index = new Map();
  for (const city of cities) {
    if (city.country !== "US") continue;
    const key = city.name.toUpperCase();
    const existing = index.get(key);
    const entry = { state: city.adminCode, population: city.population ?? 0 };
    if (!existing || entry.population > existing.population) {
      index.set(key, entry);
    }
  }
  return index;
}

function resolveState(city) {
  const normalized = String(city ?? "")
    .trim()
    .toUpperCase();
  if (!normalized) return "";
  return cityStateIndex.get(normalized)?.state ?? "";
}

function externalIdFor(address, city) {
  const key = `${String(address).trim().toUpperCase()}|${String(city).trim().toUpperCase()}`;
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
}

function parseNumber(value) {
  if (value == null || value === "") return 0;
  const n = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseBedrooms(value) {
  const n = parseNumber(value);
  return n > 0 && n <= 99 ? Math.round(n) : 0;
}

function parseBathrooms(value) {
  const n = parseNumber(value);
  return n > 0 && n <= 99 ? Math.round(n * 10) / 10 : 0;
}

function parseBoolFlag(value) {
  return value === 1 || value === "1" || value === true;
}

function mapExcelRow(row, importSource) {
  const address = String(row.Address ?? "").trim();
  const city = String(row.City ?? "").trim();
  if (!address || !city) return null;

  const externalId = externalIdFor(address, city);
  return {
    id: `propertyradar-${externalId}`,
    externalId,
    address,
    city,
    state: resolveState(city),
    zip: "",
    propertyType: String(row.Type ?? "").trim().toUpperCase(),
    squareFootage: parseNumber(row["Sq Ft"]),
    bedrooms: parseBedrooms(row.Beds),
    bathrooms: parseBathrooms(row.Baths),
    estValue: parseNumber(row["Est Value"]),
    estEquity: parseNumber(row["Est Equity $"]),
    owner: String(row.Owner ?? "").trim(),
    ownerOccupied: parseBoolFlag(row["Owner Occ?"]),
    listedForSale: parseBoolFlag(row["Listed for Sale?"]),
    listedByOwner: parseBoolFlag(row["Listed For Sale By Owner?"]),
    distressScore: parseNumber(row["Distress Score"]),
    importSource,
  };
}

function rowToJsonListing(raw, scrapedAt) {
  const mapped = mapPropertyRadarListingToRow(raw, scrapedAt);
  return {
    id: mapped.id,
    source_id: mapped.source_id,
    category: mapped.category,
    external_id: mapped.external_id,
    address: mapped.address,
    city: mapped.city,
    state: mapped.state,
    zip: mapped.zip,
    price: mapped.price,
    price_label: mapped.price_label,
    bedrooms: mapped.bedrooms,
    bathrooms: mapped.bathrooms,
    square_footage: mapped.square_footage,
    property_type: mapped.property_type,
    status: mapped.status,
    tags: mapped.tags,
    image_url: mapped.image_url,
    source_agency: mapped.source_agency,
    is_new: mapped.is_new,
    is_active: mapped.is_active,
    metadata: mapped.metadata,
    scraped_at: mapped.scraped_at,
  };
}

function main() {
  const xlsxPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_XLSX;
  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Excel file not found: ${xlsxPath}`);
  }

  const importSource = path.basename(xlsxPath);
  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const scrapedAt = new Date().toISOString();
  const seen = new Set();
  const listings = [];

  for (const row of rawRows) {
    const listing = mapExcelRow(row, importSource);
    if (!listing || seen.has(listing.id)) continue;
    seen.add(listing.id);
    listings.push(rowToJsonListing(listing, scrapedAt));
  }

  const payload = {
    scrapedAt,
    sourceUrl: "https://www.propertyradar.com",
    count: listings.length,
    listings,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(payload));
  const byCategory = {};
  for (const listing of listings) {
    byCategory[listing.category] = (byCategory[listing.category] ?? 0) + 1;
  }

  const sizeMb = (fs.statSync(OUTPUT).size / (1024 * 1024)).toFixed(2);
  console.log(`Wrote ${listings.length} listings to ${OUTPUT} (${sizeMb} MB)`);
  console.log("Categories:", byCategory);
}

main();
