import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { formatCategoryLabel } from "@/lib/admin/listing-analytics";
import type {
  AdminListingDetail,
  AdminListingDetailData,
} from "@/lib/admin/admin-listing-detail-types";

export type { AdminListingDetail, AdminListingDetailData } from "@/lib/admin/admin-listing-detail-types";

const { Client } = pg;

function emptyDetail(): AdminListingDetailData {
  return { available: false, listing: null };
}

function formatPrice(price: number, priceLabel?: string | null): string {
  if (priceLabel && String(priceLabel).trim()) return String(priceLabel).trim();
  if (!price || price <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function toIso(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  const ts = Date.parse(String(value));
  if (Number.isNaN(ts)) return null;
  return new Date(ts).toISOString();
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapDetail(row: Record<string, unknown>): AdminListingDetail {
  const price = Number(row.price) || 0;
  const tagsRaw = row.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map((t) => String(t)).filter(Boolean)
    : [];

  let metadata: Record<string, unknown> | null = null;
  if (row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)) {
    metadata = row.metadata as Record<string, unknown>;
  }

  return {
    id: String(row.id),
    sourceId: String(row.source_id ?? ""),
    sourceName: String(row.source_name ?? row.source_id ?? "Unknown"),
    sourceUrl: row.source_url ? String(row.source_url) : null,
    sourceLastScrapedAt: toIso(row.source_last_scraped_at),
    category: String(row.category ?? ""),
    categoryLabel: formatCategoryLabel(String(row.category ?? "")),
    externalId: row.external_id ? String(row.external_id) : null,
    address: String(row.address || "—"),
    city: String(row.city || ""),
    state: String(row.state || ""),
    zip: String(row.zip || ""),
    county: row.county ? String(row.county) : null,
    price,
    priceLabel: formatPrice(price, row.price_label ? String(row.price_label) : null),
    bedrooms: toNumberOrNull(row.bedrooms),
    bathrooms: toNumberOrNull(row.bathrooms),
    squareFootage: toNumberOrNull(row.square_footage),
    lotSize: toNumberOrNull(row.lot_size),
    yearBuilt: row.year_built ? String(row.year_built) : null,
    propertyType: row.property_type ? String(row.property_type) : null,
    status: row.status ? String(row.status) : null,
    tags,
    lat: toNumberOrNull(row.lat),
    lng: toNumberOrNull(row.lng),
    imageUrl: row.image_url ? String(row.image_url) : null,
    hasImage: Boolean(row.has_image ?? row.image_url),
    detailUrl: row.detail_url ? String(row.detail_url) : null,
    sourceAgency: row.source_agency ? String(row.source_agency) : null,
    isNew: Boolean(row.is_new),
    isActive: Boolean(row.is_active),
    metadata,
    scrapedAt: toIso(row.scraped_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function withPgClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T | null> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8_000,
  });

  try {
    await client.connect();
    return await fn(client);
  } catch (error) {
    console.error("[admin-listing-detail] Postgres query failed:", error);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function fetchViaPostgres(id: string): Promise<AdminListingDetailData | null> {
  return withPgClient(async (client) => {
    const result = await client.query(
      `
      SELECT
        l.*,
        coalesce(s.name, l.source_id) AS source_name,
        s.source_url,
        s.last_scraped_at AS source_last_scraped_at
      FROM listings l
      LEFT JOIN listing_sources s ON s.id = l.source_id
      WHERE l.id = $1
      LIMIT 1
    `,
      [id],
    );

    if (!result.rows[0]) {
      return { available: true, listing: null };
    }

    return {
      available: true,
      listing: mapDetail(result.rows[0] as Record<string, unknown>),
    };
  });
}

async function fetchViaSupabase(id: string): Promise<AdminListingDetailData | null> {
  const url = getSupabaseUrl();
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    getSupabaseAnonKey();
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin-listing-detail] Supabase query failed:", error.message);
    return null;
  }
  if (!data) {
    return { available: true, listing: null };
  }

  let sourceName = String(data.source_id);
  let sourceUrl: string | null = null;
  let sourceLastScrapedAt: string | null = null;

  const { data: source } = await client
    .from("listing_sources")
    .select("name, source_url, last_scraped_at")
    .eq("id", data.source_id)
    .maybeSingle();

  if (source) {
    sourceName = String(source.name ?? sourceName);
    sourceUrl = source.source_url ? String(source.source_url) : null;
    sourceLastScrapedAt = source.last_scraped_at
      ? String(source.last_scraped_at)
      : null;
  }

  return {
    available: true,
    listing: mapDetail({
      ...data,
      source_name: sourceName,
      source_url: sourceUrl,
      source_last_scraped_at: sourceLastScrapedAt,
    } as Record<string, unknown>),
  };
}

export async function fetchAdminListingById(id: string): Promise<AdminListingDetailData> {
  const listingId = id.trim();
  if (!listingId) return emptyDetail();

  try {
    const fromPg = await fetchViaPostgres(listingId);
    if (fromPg?.available) return fromPg;

    const fromSupabase = await fetchViaSupabase(listingId);
    if (fromSupabase?.available) return fromSupabase;
  } catch (error) {
    console.error("[admin-listing-detail] Unexpected failure:", error);
  }
  return emptyDetail();
}
