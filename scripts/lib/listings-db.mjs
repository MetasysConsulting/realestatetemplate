/**
 * Shared Supabase listings sync — upsert by stable id, deactivate stale rows.
 */
import pg from "pg";

const { Client } = pg;

export const UPSERT_LISTING_SQL = `
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

export function mapHudListingToRow(raw, scrapedAt) {
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
      scrapeSource: "hud",
    },
    scraped_at: scrapedAt,
  };
}

function listingToValues(listing) {
  return [
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
}

export function createListingsDbClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Use: node --env-file=.env.local …");
  }

  return new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
}

export async function upsertListings(client, listings, { batchSize = 100 } = {}) {
  for (let offset = 0; offset < listings.length; offset += batchSize) {
    const batch = listings.slice(offset, offset + batchSize);
    const values = [];
    const placeholders = batch
      .map((listing, index) => {
        const base = index * 28;
        values.push(...listingToValues(listing));
        const params = Array.from({ length: 28 }, (_, i) => `$${base + i + 1}`);
        params[26] = `${params[26]}::jsonb`;
        return `(${params.join(", ")})`;
      })
      .join(",\n");

    await client.query(
      `${UPSERT_LISTING_SQL.trim().replace(
        /VALUES \([\s\S]*?\)\s*ON CONFLICT/,
        `VALUES ${placeholders}\nON CONFLICT`,
      )}`,
      values,
    );
  }
}

/**
 * Mark listings from this source that were not seen in the latest scrape as inactive.
 * Prevents duplicate rows — same case number always maps to the same id (hud-{caseNumber}).
 */
export async function deactivateListingsNotInSet(client, sourceId, activeIds) {
  if (!activeIds.length) {
    const result = await client.query(
      `UPDATE listings SET is_active = false, updated_at = NOW()
       WHERE source_id = $1 AND is_active = true`,
      [sourceId],
    );
    return result.rowCount ?? 0;
  }

  const result = await client.query(
    `UPDATE listings SET is_active = false, updated_at = NOW()
     WHERE source_id = $1 AND is_active = true AND NOT (id = ANY($2::text[]))`,
    [sourceId, activeIds],
  );
  return result.rowCount ?? 0;
}

export async function updateSourceScrapedAt(client, sourceId, scrapedAt, sourceUrl) {
  await client.query(
    `UPDATE listing_sources
     SET last_scraped_at = $2, source_url = COALESCE($3, source_url), updated_at = NOW()
     WHERE id = $1`,
    [sourceId, scrapedAt, sourceUrl],
  );
}

export function mapVrmListingToRow(raw, scrapedAt) {
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
    price_label: raw.listPrice > 0 ? "List Price" : "Price TBD",
    bedrooms: raw.bedrooms ?? 0,
    bathrooms: raw.bathrooms ?? 0,
    square_footage: raw.squareFootage ?? 0,
    lot_size: raw.lotSize ?? null,
    year_built: null,
    property_type: raw.propertyType ?? "VA REO",
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
      scrapeSource: "vrm",
    },
    scraped_at: scrapedAt,
  };
}

/**
 * Upsert listings for one source with dedupe:
 * - stable id per listing (e.g. vrm-{assetId}, hud-{caseNumber})
 * - UNIQUE (source_id, external_id) in DB as second guard
 * - upsert updates existing rows instead of inserting duplicates
 * - listings no longer in the latest scrape are marked inactive (not deleted)
 */
export async function syncSourceListingsToDatabase(
  sourceId,
  listings,
  { scrapedAt, sourceUrl, mapRow, deactivateMissing = true },
) {
  const client = createListingsDbClient();
  await client.connect();

  try {
    await client.query("BEGIN");

    const rows = listings.map((listing) => mapRow(listing, scrapedAt));
    await upsertListings(client, rows);

    let deactivated = 0;
    if (deactivateMissing) {
      const activeIds = rows.map((row) => row.id);
      deactivated = await deactivateListingsNotInSet(client, sourceId, activeIds);
    }
    await updateSourceScrapedAt(client, sourceId, scrapedAt, sourceUrl);

    await client.query("COMMIT");

    return {
      upserted: rows.length,
      deactivated,
      sourceId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

export async function syncHudListingsToDatabase(listings, { scrapedAt, sourceUrl }) {
  return syncSourceListingsToDatabase("hud", listings, {
    scrapedAt,
    sourceUrl,
    mapRow: mapHudListingToRow,
  });
}

export async function syncVrmListingsToDatabase(listings, { scrapedAt, sourceUrl }) {
  return syncSourceListingsToDatabase("vrm", listings, {
    scrapedAt,
    sourceUrl,
    mapRow: mapVrmListingToRow,
  });
}

const PROPERTY_RADAR_TYPE_LABELS = {
  SFR: "Single Family",
  CND: "Condo",
  MFR: "Multi Family",
  LND: "Land",
  COM: "Commercial",
};

export function resolvePropertyRadarCategory(raw) {
  const distress = Number(raw.distressScore) || 0;
  if (distress >= 80) return "pre-foreclosure";
  if (distress >= 60) return "foreclosure";
  if (distress >= 40) return "motivated-seller";
  return "off-market";
}

export function mapPropertyRadarListingToRow(raw, scrapedAt) {
  const category = resolvePropertyRadarCategory(raw);
  const tags = ["PropertyRadar"];
  if (raw.distressScore != null) tags.push(`Distress ${raw.distressScore}`);
  if (raw.ownerOccupied) tags.push("Owner Occupied");
  if (raw.listedForSale) tags.push("Listed");
  if (raw.listedByOwner) tags.push("FSBO");
  if (raw.importSource === "pilot-html-100") tags.push("Pilot 100");
  if (raw.importSource?.startsWith("propertyradar-html")) tags.push("HTML Scrape");

  const imageUrl = raw.imageUrl ?? null;

  return {
    id: raw.id,
    source_id: "propertyradar",
    category,
    external_id:
      raw.externalId ??
      (typeof raw.id === "string" ? raw.id.replace(/^propertyradar-/, "") : raw.id),
    address: raw.address,
    city: raw.city,
    state: raw.state ?? "",
    zip: raw.zip ?? "",
    county: null,
    price: raw.estValue ?? 0,
    price_label: "Est. Value",
    bedrooms: raw.bedrooms ?? 0,
    bathrooms: raw.bathrooms ?? 0,
    square_footage: raw.squareFootage ?? 0,
    lot_size: raw.lotSize ?? null,
    year_built: raw.yearBuilt != null ? String(raw.yearBuilt) : null,
    property_type: PROPERTY_RADAR_TYPE_LABELS[raw.propertyType] ?? raw.propertyType ?? null,
    status: raw.listedForSale ? "Listed" : "Off Market",
    tags,
    lat: null,
    lng: null,
    image_url: imageUrl,
    detail_url: raw.detailUrl ?? null,
    source_agency: "PropertyRadar",
    is_new: raw.importSource === "pilot-html-100",
    is_active: true,
    metadata: {
      propertyTypeCode: raw.propertyType,
      estValue: raw.estValue,
      estEquity: raw.estEquity,
      distressScore: raw.distressScore,
      radarId: raw.radarId ?? null,
      listingId: raw.id,
      owner: raw.owner,
      ownerOccupied: raw.ownerOccupied,
      listedForSale: raw.listedForSale,
      listedByOwner: raw.listedByOwner,
      imageUrl,
      overviewPhotoUrl: raw.overviewPhotoUrl ?? null,
      hasImage: Boolean(imageUrl || raw.overviewPhotoUrl),
      pendingImage: !imageUrl && !raw.overviewPhotoUrl,
      sourceUrl: raw.detailUrl ?? "https://www.propertyradar.com",
      scrapeSource: "propertyradar",
      importSource: raw.importSource ?? "xlsx",
      htmlSnapshotPath: raw.htmlSnapshotPath ?? null,
    },
    scraped_at: scrapedAt,
  };
}

export async function syncPropertyRadarListingsToDatabase(
  listings,
  { scrapedAt, sourceUrl, deactivateMissing = true },
) {
  return syncSourceListingsToDatabase("propertyradar", listings, {
    scrapedAt,
    sourceUrl,
    mapRow: mapPropertyRadarListingToRow,
    deactivateMissing,
  });
}

export async function upsertPropertyRadarListings(listings, scrapedAt) {
  const client = createListingsDbClient();
  await client.connect();
  try {
    const rows = listings.map((listing) => mapPropertyRadarListingToRow(listing, scrapedAt));
    await upsertListings(client, rows);
    return rows.length;
  } finally {
    await client.end();
  }
}
