/**
 * Import PropertyRadar Excel export into Supabase.
 * Usage: node --env-file=.env.local scripts/import-propertyradar-xlsx.mjs [path-to-xlsx]
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import allCities from "all-the-cities";
import XLSX from "xlsx";
import {
  mapPropertyRadarListingToRow,
  syncPropertyRadarListingsToDatabase,
} from "./lib/listings-db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEFAULT_XLSX = path.join(ROOT, "..", "Export-20260618-082223.xlsx");
const SOURCE_URL = "https://www.propertyradar.com";

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

function readExcelRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

async function main() {
  const xlsxPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_XLSX;

  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Excel file not found: ${xlsxPath}`);
  }

  const importSource = path.basename(xlsxPath);
  const rawRows = readExcelRows(xlsxPath);
  const listings = [];
  const seen = new Set();

  for (const row of rawRows) {
    const listing = mapExcelRow(row, importSource);
    if (!listing || seen.has(listing.id)) continue;
    seen.add(listing.id);
    listings.push(listing);
  }

  const scrapedAt = new Date().toISOString();
  const categoryCounts = {};
  for (const listing of listings) {
    const mapped = mapPropertyRadarListingToRow(listing, scrapedAt);
    categoryCounts[mapped.category] = (categoryCounts[mapped.category] ?? 0) + 1;
  }

  console.log(`Read ${rawRows.length} rows from ${xlsxPath}`);
  console.log(`Importing ${listings.length} unique PropertyRadar listings`);
  console.log("Category breakdown:", categoryCounts);

  const result = await syncPropertyRadarListingsToDatabase(listings, {
    scrapedAt,
    sourceUrl: SOURCE_URL,
  });

  console.log("Sync complete:", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
