/**
 * Seed Supabase listings from scraped JSON files.
 * Usage: node --env-file=.env.local scripts/seed-supabase-listings.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "src/data");

const { Client } = pg;

function readJson(name) {
  const file = path.join(DATA, name);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function row(listing) {
  const values = [
    listing.id,
    listing.source_id,
    listing.category,
    listing.external_id,
    listing.address,
    listing.city,
    listing.state,
    listing.zip,
    listing.county,
    listing.price,
    listing.price_label,
    listing.bedrooms,
    listing.bathrooms,
    listing.square_footage,
    listing.lot_size,
    listing.year_built,
    listing.property_type,
    listing.status,
    listing.tags,
    listing.lat,
    listing.lng,
    listing.image_url,
    listing.detail_url,
    listing.source_agency,
    listing.is_new,
    listing.is_active,
    JSON.stringify(listing.metadata),
    listing.scraped_at,
  ];
  return values;
}

const UPSERT_SQL = `
INSERT INTO listings (
  id, source_id, category, external_id,
  address, city, state, zip, county,
  price, price_label, bedrooms, bathrooms, square_footage, lot_size, year_built,
  property_type, status, tags,
  lat, lng, image_url, detail_url, source_agency,
  is_new, is_active, metadata, scraped_at
) VALUES (
  $1, $2, $3, $4,
  $5, $6, $7, $8, $9,
  $10, $11, $12, $13, $14, $15, $16,
  $17, $18, $19,
  $20, $21, $22, $23, $24,
  $25, $26, $27::jsonb, $28
)
ON CONFLICT (id) DO UPDATE SET
  source_id = EXCLUDED.source_id,
  category = EXCLUDED.category,
  external_id = EXCLUDED.external_id,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  zip = EXCLUDED.zip,
  county = EXCLUDED.county,
  price = EXCLUDED.price,
  price_label = EXCLUDED.price_label,
  bedrooms = EXCLUDED.bedrooms,
  bathrooms = EXCLUDED.bathrooms,
  square_footage = EXCLUDED.square_footage,
  lot_size = EXCLUDED.lot_size,
  year_built = EXCLUDED.year_built,
  property_type = EXCLUDED.property_type,
  status = EXCLUDED.status,
  tags = EXCLUDED.tags,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  image_url = EXCLUDED.image_url,
  detail_url = EXCLUDED.detail_url,
  source_agency = EXCLUDED.source_agency,
  is_new = EXCLUDED.is_new,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  scraped_at = EXCLUDED.scraped_at,
  updated_at = NOW();
`;

function mapHud(raw, scrapedAt) {
  return {
    id: raw.id,
    source_id: "hud",
    category: "hud-home",
    external_id: raw.caseNumber,
    address: raw.address,
    city: raw.city,
    state: raw.state,
    zip: raw.zip,
    county: raw.county ?? null,
    price: raw.listPrice,
    price_label: "List Price",
    bedrooms: raw.bedrooms ?? 0,
    bathrooms: raw.bathrooms ?? 0,
    square_footage: raw.squareFootage ?? 0,
    lot_size: null,
    year_built: raw.yearBuilt ?? null,
    property_type: raw.propertyType ?? null,
    status: raw.propertyStatus ?? null,
    tags: [raw.propertyType, raw.listingPeriod].filter(Boolean),
    lat: raw.lat ?? null,
    lng: raw.lng ?? null,
    image_url: raw.imageUrl ?? null,
    detail_url: raw.detailUrl ?? null,
    source_agency: raw.sourceAgency ?? "HUD",
    is_new: false,
    is_active: true,
    metadata: {
      caseNumber: raw.caseNumber,
      listingPeriod: raw.listingPeriod,
      listDate: raw.listDate,
      bidOpenDate: raw.bidOpenDate,
      periodDeadlineDate: raw.periodDeadlineDate,
      fhaFinancing: raw.fhaFinancing,
      eligibleBidders: raw.eligibleBidders,
      sourceUrl: raw.sourceUrl,
    },
    scraped_at: scrapedAt,
  };
}

function mapVrm(raw, scrapedAt) {
  return {
    id: raw.id,
    source_id: "vrm",
    category: "bank-owned",
    external_id: raw.propertyId,
    address: raw.address,
    city: raw.city,
    state: raw.state,
    zip: raw.zip,
    county: raw.county ?? null,
    price: raw.listPrice,
    price_label: "List Price",
    bedrooms: raw.bedrooms ?? 0,
    bathrooms: raw.bathrooms ?? 0,
    square_footage: raw.squareFootage ?? 0,
    lot_size: raw.lotSize ?? null,
    year_built: null,
    property_type: "VA REO",
    status: raw.status ?? null,
    tags: raw.isVendeeFinancing ? ["VA REO", "Vendee Financing"] : ["VA REO"],
    lat: null,
    lng: null,
    image_url: raw.imageUrl ?? null,
    detail_url: raw.detailUrl ?? null,
    source_agency: raw.sourceAgency ?? "VRM Properties",
    is_new: Boolean(raw.isNew),
    is_active: true,
    metadata: {
      propertyId: raw.propertyId,
      isVendeeFinancing: raw.isVendeeFinancing,
      sourceUrl: raw.sourceUrl,
    },
    scraped_at: scrapedAt,
  };
}

function mapHomeSteps(raw, scrapedAt) {
  return {
    id: raw.id,
    source_id: "homesteps",
    category: "bank-owned",
    external_id: raw.id.replace(/^homesteps-/, ""),
    address: raw.address,
    city: raw.city,
    state: raw.state,
    zip: raw.zip,
    county: null,
    price: raw.listPrice,
    price_label: "List Price",
    bedrooms: 0,
    bathrooms: 0,
    square_footage: 0,
    lot_size: null,
    year_built: null,
    property_type: "Bank Owned",
    status: "For Sale",
    tags: ["Freddie Mac", "REO"],
    lat: raw.lat ?? null,
    lng: raw.lng ?? null,
    image_url: raw.imageUrl ?? null,
    detail_url: raw.detailUrl ?? null,
    source_agency: raw.sourceAgency ?? "Freddie Mac HomeSteps",
    is_new: false,
    is_active: true,
    metadata: {
      searchState: raw.searchState,
      sourceUrl: raw.sourceUrl,
    },
    scraped_at: scrapedAt,
  };
}

function mapGsaSales(raw, scrapedAt) {
  return {
    id: raw.id,
    source_id: "gsa-sales",
    category: "auction-property",
    external_id: raw.propertyId,
    address: raw.address,
    city: raw.city,
    state: raw.state,
    zip: raw.zip,
    county: null,
    price: raw.startingBid,
    price_label: "Starting Bid",
    bedrooms: 0,
    bathrooms: 0,
    square_footage: 0,
    lot_size: null,
    year_built: null,
    property_type: raw.propertyType ?? null,
    status: raw.status ?? null,
    tags: [raw.auctionType, "Federal Auction"].filter(Boolean),
    lat: null,
    lng: null,
    image_url: raw.imageUrl ?? null,
    detail_url: raw.detailUrl ?? null,
    source_agency: raw.sourceAgency ?? "GSA",
    is_new: false,
    is_active: true,
    metadata: {
      title: raw.title,
      auctionType: raw.auctionType,
      propertyId: raw.propertyId,
      sourceUrl: raw.sourceUrl,
    },
    scraped_at: scrapedAt,
  };
}

function mapGsaDispositions(raw, scrapedAt) {
  return {
    id: raw.id,
    source_id: "gsa-dispositions",
    category: "auction-property",
    external_id: raw.id,
    address: raw.address,
    city: raw.city,
    state: raw.state,
    zip: raw.zip,
    county: null,
    price: 0,
    price_label: "Government Disposition",
    bedrooms: 0,
    bathrooms: 0,
    square_footage: raw.rentableSqFt ?? 0,
    lot_size: null,
    year_built: null,
    property_type: raw.propertyType ?? null,
    status: raw.status ?? "Available",
    tags: ["GSA Disposition", raw.propertyType].filter(Boolean),
    lat: null,
    lng: null,
    image_url: raw.imageUrl ?? null,
    detail_url: raw.sourceUrl ?? null,
    source_agency: raw.sourceAgency ?? "GSA",
    is_new: false,
    is_active: raw.status !== "SOLD",
    metadata: {
      title: raw.title,
      rentableSqFt: raw.rentableSqFt,
      dateListed: raw.dateListed,
      imageNote: raw.imageNote,
      sourceUrl: raw.sourceUrl,
    },
    scraped_at: scrapedAt,
  };
}

async function upsertBatch(client, listings) {
  for (const listing of listings) {
    await client.query(UPSERT_SQL, row(listing));
  }
}

async function updateSourceScrapedAt(client, sourceId, scrapedAt) {
  if (!scrapedAt) return;
  await client.query(
    `UPDATE listing_sources SET last_scraped_at = $2, updated_at = NOW() WHERE id = $1`,
    [sourceId, scrapedAt],
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/seed-supabase-listings.mjs");
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to Supabase Postgres");

  const datasets = [
    { file: "hud-listings.json", source: "hud", map: (d) => d.listings.map((l) => mapHud(l, d.scrapedAt)) },
    { file: "vrm-listings.json", source: "vrm", map: (d) => d.listings.map((l) => mapVrm(l, d.scrapedAt)) },
    { file: "homesteps-listings.json", source: "homesteps", map: (d) => d.listings.map((l) => mapHomeSteps(l, d.scrapedAt)) },
    { file: "gsa-realestatesales.json", source: "gsa-sales", map: (d) => d.listings.map((l) => mapGsaSales(l, d.scrapedAt)) },
    { file: "gsa-dispositions.json", source: "gsa-dispositions", map: (d) => d.listings.map((l) => mapGsaDispositions(l, d.scrapedAt)) },
  ];

  let total = 0;

  for (const { file, source, map } of datasets) {
    const data = readJson(file);
    if (!data?.listings?.length) {
      console.log(`  skip ${file} (missing or empty)`);
      continue;
    }

    const listings = map(data);
    await upsertBatch(client, listings);
    await updateSourceScrapedAt(client, source, data.scrapedAt);
    console.log(`  ✓ ${file}: ${listings.length} listings`);
    total += listings.length;
  }

  const summary = await client.query(`
    SELECT source_id, category, COUNT(*)::int AS count
    FROM listings
    WHERE is_active = TRUE
    GROUP BY source_id, category
    ORDER BY count DESC
  `);

  console.log(`\nDone. Upserted ${total} listings.`);
  console.log("Active listings in database:");
  for (const r of summary.rows) {
    console.log(`  ${r.source_id} (${r.category}): ${r.count}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
