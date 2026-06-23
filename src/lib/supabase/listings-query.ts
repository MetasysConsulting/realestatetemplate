import pg from "pg";
import type { DatabaseListingRow } from "@/lib/supabase/server";

const { Client } = pg;

const LISTING_COLUMNS = `
  id, source_id, category, external_id,
  address, city, state, zip, county,
  price, price_label, bedrooms, bathrooms, square_footage, lot_size, year_built,
  property_type, status, tags,
  lat, lng, image_url, detail_url, source_agency,
  is_new, is_active, metadata, scraped_at
`;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

function mapListingRow(row: pg.QueryResultRow): DatabaseListingRow {
  return {
    id: row.id,
    source_id: row.source_id,
    category: row.category,
    external_id: row.external_id,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    county: row.county,
    price: Number(row.price) || 0,
    price_label: row.price_label,
    bedrooms: row.bedrooms,
    bathrooms: Number(row.bathrooms) || 0,
    square_footage: row.square_footage,
    lot_size: row.lot_size != null ? Number(row.lot_size) : null,
    year_built: row.year_built,
    property_type: row.property_type,
    status: row.status,
    tags: row.tags,
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    image_url: row.image_url,
    detail_url: row.detail_url,
    source_agency: row.source_agency,
    is_new: row.is_new,
    is_active: row.is_active,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    scraped_at: row.scraped_at,
  };
}

type ListingQueryOptions = {
  sourceId?: string;
  category?: string;
  id?: string;
  externalId?: string;
  includeInactive?: boolean;
  pageSize?: number;
};

async function withPgClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T | null> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    return await fn(client);
  } catch (error) {
    console.error("[listings-query] Postgres query failed:", error);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function fetchListingRowsFromPostgres(
  options: ListingQueryOptions,
): Promise<DatabaseListingRow[] | null> {
  const pageSize = options.pageSize ?? 1000;

  return withPgClient(async (client) => {
    const rows: DatabaseListingRow[] = [];
    let offset = 0;
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (options.sourceId) {
      values.push(options.sourceId);
      conditions.push(`source_id = $${values.length}`);
    }

    if (options.category) {
      values.push(options.category);
      conditions.push(`category = $${values.length}`);
    }

    if (options.id) {
      values.push(options.id);
      conditions.push(`id = $${values.length}`);
    }

    if (options.externalId) {
      values.push(options.externalId);
      conditions.push(`external_id = $${values.length}`);
    }

    if (!options.includeInactive) {
      conditions.push("is_active = true");
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    while (true) {
      const limitIndex = values.length + 1;
      const offsetIndex = values.length + 2;
      const result = await client.query(
        `SELECT ${LISTING_COLUMNS}
         FROM listings
         ${whereClause}
         ORDER BY price DESC
         LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
        [...values, pageSize, offset],
      );

      if (!result.rows.length) break;
      rows.push(...result.rows.map(mapListingRow));
      if (result.rows.length < pageSize) break;
      offset += pageSize;
    }

    return rows;
  });
}

export async function fetchListingRowFromPostgres(
  options: Omit<ListingQueryOptions, "pageSize">,
): Promise<DatabaseListingRow | null> {
  const rows = await fetchListingRowsFromPostgres({ ...options, pageSize: 1 });
  return rows?.[0] ?? null;
}

export async function fetchSourceMetaFromPostgres(
  sourceId: string,
): Promise<{ scrapedAt: string; sourceUrl: string } | null> {
  return withPgClient(async (client) => {
    const result = await client.query(
      `SELECT last_scraped_at, source_url
       FROM listing_sources
       WHERE id = $1`,
      [sourceId],
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      scrapedAt: row.last_scraped_at ?? new Date().toISOString(),
      sourceUrl: row.source_url ?? "",
    };
  });
}
