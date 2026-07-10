import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { formatCategoryLabel } from "@/lib/admin/listing-analytics";
import type {
  AdminListingRow,
  AdminListingsData,
} from "@/lib/admin/admin-listings-types";

export type { AdminListingRow, AdminListingsData } from "@/lib/admin/admin-listings-types";
export { formatAdminListingsCount as formatCount } from "@/lib/admin/admin-listings-types";

const { Client } = pg;

const HIDDEN_SOURCE_IDS = new Set(["mock"]);
const DEFAULT_LIMIT = 100;

function emptyData(): AdminListingsData {
  return {
    available: false,
    totalActive: 0,
    totalInactive: 0,
    bySource: [],
    byCategory: [],
    listings: [],
  };
}

function formatPrice(price: number): string {
  if (!price || price <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
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
    console.error("[admin-listings] Postgres query failed:", error);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function fetchViaPostgres(): Promise<AdminListingsData | null> {
  return withPgClient(async (client) => {
    const [totals, bySource, byCategory, rows] = await Promise.all([
      client.query(`
        SELECT
          COUNT(*) FILTER (WHERE is_active)::int AS active,
          COUNT(*) FILTER (WHERE NOT is_active)::int AS inactive
        FROM listings
      `),
      client.query(`
        SELECT
          s.id AS source_id,
          s.name,
          COUNT(l.*) FILTER (WHERE l.is_active)::int AS count
        FROM listing_sources s
        LEFT JOIN listings l ON l.source_id = s.id
        GROUP BY s.id
        ORDER BY count DESC, s.name ASC
      `),
      client.query(`
        SELECT category, COUNT(*)::int AS count
        FROM listings
        WHERE is_active = TRUE
        GROUP BY category
        ORDER BY count DESC, category ASC
      `),
      client.query(
        `
        SELECT
          l.id,
          l.source_id,
          coalesce(s.name, l.source_id) AS source_name,
          l.category,
          l.address,
          l.city,
          l.state,
          l.zip,
          l.price,
          l.status,
          l.is_active,
          coalesce(l.has_image, false) AS has_image,
          l.detail_url
        FROM listings l
        LEFT JOIN listing_sources s ON s.id = l.source_id
        WHERE l.is_active = TRUE
          AND l.source_id IS DISTINCT FROM 'mock'
        ORDER BY l.updated_at DESC NULLS LAST, l.scraped_at DESC NULLS LAST
        LIMIT $1
      `,
        [DEFAULT_LIMIT],
      ),
    ]);

    const totalActive = Number(totals.rows[0]?.active) || 0;
    const totalInactive = Number(totals.rows[0]?.inactive) || 0;

    return {
      available: true,
      totalActive,
      totalInactive,
      bySource: bySource.rows
        .filter((row) => !HIDDEN_SOURCE_IDS.has(String(row.source_id)))
        .map((row) => ({
          sourceId: String(row.source_id),
          name: String(row.name),
          count: Number(row.count) || 0,
        }))
        .filter((row) => row.count > 0),
      byCategory: byCategory.rows.map((row) => ({
        category: String(row.category),
        label: formatCategoryLabel(String(row.category)),
        count: Number(row.count) || 0,
      })),
      listings: rows.rows.map((row) => {
        const price = Number(row.price) || 0;
        return {
          id: String(row.id),
          sourceId: String(row.source_id),
          sourceName: String(row.source_name),
          category: String(row.category),
          categoryLabel: formatCategoryLabel(String(row.category)),
          address: String(row.address || "—"),
          city: String(row.city || ""),
          state: String(row.state || ""),
          zip: String(row.zip || ""),
          price,
          priceLabel: formatPrice(price),
          status: row.status ? String(row.status) : null,
          isActive: Boolean(row.is_active),
          hasImage: Boolean(row.has_image),
          detailUrl: row.detail_url ? String(row.detail_url) : null,
        };
      }),
    };
  });
}

async function fetchViaSupabase(): Promise<AdminListingsData | null> {
  const url = getSupabaseUrl();
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    getSupabaseAnonKey();
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: sources }, { data: listings, error }, { count: activeCount }] = await Promise.all([
    client.from("listing_sources").select("id, name"),
    client
      .from("listings")
      .select(
        "id, source_id, category, address, city, state, zip, price, status, is_active, has_image, detail_url, updated_at, scraped_at",
      )
      .eq("is_active", true)
      .neq("source_id", "mock")
      .order("updated_at", { ascending: false })
      .limit(DEFAULT_LIMIT),
    client
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  if (error) {
    console.error("[admin-listings] Supabase query failed:", error.message);
    return null;
  }

  const sourceNameById = new Map(
    (sources ?? []).map((s) => [String(s.id), String(s.name)]),
  );

  const bySourceMap = new Map<string, number>();

  // Approximate source/category counts from the fetched page is wrong for totals.
  // Pull lightweight counts with head queries per known source when possible.
  const sourceIds = [...sourceNameById.keys()].filter((id) => !HIDDEN_SOURCE_IDS.has(id));
  await Promise.all(
    sourceIds.map(async (sourceId) => {
      const { count } = await client
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("source_id", sourceId);
      bySourceMap.set(sourceId, count ?? 0);
    }),
  );

  // Better category counts from a broader category-only sample.
  const { data: categoryRows } = await client
    .from("listings")
    .select("category")
    .eq("is_active", true)
    .limit(5000);

  const categoryCounts = new Map<string, number>();
  for (const row of categoryRows ?? []) {
    const category = String(row.category ?? "");
    if (!category) continue;
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }

  return {
    available: true,
    totalActive: activeCount ?? listings?.length ?? 0,
    totalInactive: 0,
    bySource: sourceIds
      .map((sourceId) => ({
        sourceId,
        name: sourceNameById.get(sourceId) ?? sourceId,
        count: bySourceMap.get(sourceId) ?? 0,
      }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count),
    byCategory: [...categoryCounts.entries()]
      .map(([category, count]) => ({
        category,
        label: formatCategoryLabel(category),
        count,
      }))
      .sort((a, b) => b.count - a.count),
    listings: (listings ?? []).map((row) => {
      const price = Number(row.price) || 0;
      const sourceId = String(row.source_id);
      return {
        id: String(row.id),
        sourceId,
        sourceName: sourceNameById.get(sourceId) ?? sourceId,
        category: String(row.category ?? ""),
        categoryLabel: formatCategoryLabel(String(row.category ?? "")),
        address: String(row.address || "—"),
        city: String(row.city || ""),
        state: String(row.state || ""),
        zip: String(row.zip || ""),
        price,
        priceLabel: formatPrice(price),
        status: row.status ? String(row.status) : null,
        isActive: Boolean(row.is_active),
        hasImage: Boolean(row.has_image),
        detailUrl: row.detail_url ? String(row.detail_url) : null,
      };
    }),
  };
}

export async function fetchAdminListingsData(): Promise<AdminListingsData> {
  try {
    const fromPg = await fetchViaPostgres();
    if (fromPg?.available) return fromPg;

    const fromSupabase = await fetchViaSupabase();
    if (fromSupabase?.available) return fromSupabase;
  } catch (error) {
    console.error("[admin-listings] Unexpected failure:", error);
  }
  return emptyData();
}
