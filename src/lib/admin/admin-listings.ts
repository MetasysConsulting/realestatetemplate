import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { formatCategoryLabel } from "@/lib/admin/listing-analytics";
import {
  ADMIN_LISTINGS_DEFAULT_PAGE_SIZE,
  escapeIlikePattern,
  parseAdminListingsQuery,
  type AdminListingRow,
  type AdminListingsData,
  type AdminListingsQuery,
} from "@/lib/admin/admin-listings-types";

export type { AdminListingRow, AdminListingsData, AdminListingsQuery } from "@/lib/admin/admin-listings-types";
export {
  formatAdminListingsCount as formatCount,
  buildAdminListingsHref,
  parseAdminListingsQuery,
} from "@/lib/admin/admin-listings-types";

const { Client } = pg;

const HIDDEN_SOURCE_IDS = new Set(["mock"]);

function emptyData(query?: AdminListingsQuery): AdminListingsData {
  const q =
    query ??
    parseAdminListingsQuery({
      page: "1",
      pageSize: String(ADMIN_LISTINGS_DEFAULT_PAGE_SIZE),
    });
  return {
    available: false,
    totalActive: 0,
    totalInactive: 0,
    bySource: [],
    byCategory: [],
    listings: [],
    filteredTotal: 0,
    page: q.page,
    pageSize: q.pageSize,
    totalPages: 0,
    query: q,
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

function toIso(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  const ts = Date.parse(String(value));
  if (Number.isNaN(ts)) return null;
  return new Date(ts).toISOString();
}

function mapListingRow(row: Record<string, unknown>): AdminListingRow {
  const price = Number(row.price) || 0;
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    sourceName: String(row.source_name ?? row.source_id),
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
    updatedAt: toIso(row.updated_at),
  };
}

function normalizeQuery(input?: Partial<AdminListingsQuery> | AdminListingsQuery): AdminListingsQuery {
  if (!input) {
    return parseAdminListingsQuery({});
  }
  return {
    q: (input.q ?? "").trim(),
    sourceId: input.sourceId || "all",
    category: input.category || "all",
    active: input.active === "0" || input.active === "all" ? input.active : "1",
    page: Math.max(1, Math.floor(Number(input.page) || 1)),
    pageSize: Math.min(
      100,
      Math.max(20, Math.floor(Number(input.pageSize) || ADMIN_LISTINGS_DEFAULT_PAGE_SIZE)),
    ),
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
    console.error("[admin-listings] Postgres query failed:", error);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function buildWhereClause(query: AdminListingsQuery): {
  sql: string;
  params: unknown[];
} {
  const params: unknown[] = [];
  const clauses = [`l.source_id IS DISTINCT FROM 'mock'`];

  if (query.active === "1") {
    clauses.push("l.is_active = TRUE");
  } else if (query.active === "0") {
    clauses.push("l.is_active = FALSE");
  }

  if (query.sourceId !== "all") {
    params.push(query.sourceId);
    clauses.push(`l.source_id = $${params.length}`);
  }

  if (query.category !== "all") {
    params.push(query.category);
    clauses.push(`l.category = $${params.length}`);
  }

  if (query.q) {
    const pattern = `%${escapeIlikePattern(query.q)}%`;
    params.push(pattern);
    const idx = params.length;
    clauses.push(`(
      l.id ILIKE $${idx} ESCAPE '\\'
      OR l.external_id ILIKE $${idx} ESCAPE '\\'
      OR l.address ILIKE $${idx} ESCAPE '\\'
      OR l.city ILIKE $${idx} ESCAPE '\\'
      OR l.state ILIKE $${idx} ESCAPE '\\'
      OR l.zip ILIKE $${idx} ESCAPE '\\'
      OR coalesce(s.name, '') ILIKE $${idx} ESCAPE '\\'
      OR coalesce(l.category, '') ILIKE $${idx} ESCAPE '\\'
    )`);
  }

  return { sql: clauses.join(" AND "), params };
}

async function fetchViaPostgres(query: AdminListingsQuery): Promise<AdminListingsData | null> {
  return withPgClient(async (client) => {
    const where = buildWhereClause(query);
    const offset = (query.page - 1) * query.pageSize;

    const countParams = [...where.params];
    const listParams = [...where.params, query.pageSize, offset];
    const limitIdx = where.params.length + 1;
    const offsetIdx = where.params.length + 2;

    const [totals, bySource, byCategory, countResult, rows] = await Promise.all([
      client.query(`
        SELECT
          COUNT(*) FILTER (WHERE is_active)::int AS active,
          COUNT(*) FILTER (WHERE NOT is_active)::int AS inactive
        FROM listings
        WHERE source_id IS DISTINCT FROM 'mock'
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
          AND source_id IS DISTINCT FROM 'mock'
        GROUP BY category
        ORDER BY count DESC, category ASC
      `),
      client.query(
        `
        SELECT COUNT(*)::int AS total
        FROM listings l
        LEFT JOIN listing_sources s ON s.id = l.source_id
        WHERE ${where.sql}
      `,
        countParams,
      ),
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
          l.detail_url,
          l.updated_at
        FROM listings l
        LEFT JOIN listing_sources s ON s.id = l.source_id
        WHERE ${where.sql}
        ORDER BY l.updated_at DESC NULLS LAST, l.scraped_at DESC NULLS LAST
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
        listParams,
      ),
    ]);

    const filteredTotal = Number(countResult.rows[0]?.total) || 0;
    const totalPages = filteredTotal > 0 ? Math.ceil(filteredTotal / query.pageSize) : 0;
    const page = totalPages > 0 ? Math.min(query.page, totalPages) : 1;

    // If requested page is past the end, re-fetch last page once.
    let listingRows = rows.rows;
    let effectivePage = page;
    if (query.page > page && totalPages > 0) {
      effectivePage = totalPages;
      const retryOffset = (effectivePage - 1) * query.pageSize;
      const retry = await client.query(
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
          l.detail_url,
          l.updated_at
        FROM listings l
        LEFT JOIN listing_sources s ON s.id = l.source_id
        WHERE ${where.sql}
        ORDER BY l.updated_at DESC NULLS LAST, l.scraped_at DESC NULLS LAST
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
        [...where.params, query.pageSize, retryOffset],
      );
      listingRows = retry.rows;
    }

    return {
      available: true,
      totalActive: Number(totals.rows[0]?.active) || 0,
      totalInactive: Number(totals.rows[0]?.inactive) || 0,
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
      listings: listingRows.map((row) => mapListingRow(row as Record<string, unknown>)),
      filteredTotal,
      page: effectivePage,
      pageSize: query.pageSize,
      totalPages,
      query: { ...query, page: effectivePage },
    };
  });
}

async function fetchViaSupabase(query: AdminListingsQuery): Promise<AdminListingsData | null> {
  const url = getSupabaseUrl();
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    getSupabaseAnonKey();
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: sources }, { count: activeCount }, { count: inactiveCount }] =
    await Promise.all([
      client.from("listing_sources").select("id, name"),
      client
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .neq("source_id", "mock"),
      client
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("is_active", false)
        .neq("source_id", "mock"),
    ]);

  const sourceNameById = new Map(
    (sources ?? []).map((s) => [String(s.id), String(s.name)]),
  );
  const sourceIds = [...sourceNameById.keys()].filter((id) => !HIDDEN_SOURCE_IDS.has(id));

  const bySourceMap = new Map<string, number>();
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

  const { data: categoryRows } = await client
    .from("listings")
    .select("category")
    .eq("is_active", true)
    .neq("source_id", "mock")
    .limit(8000);

  const categoryCounts = new Map<string, number>();
  for (const row of categoryRows ?? []) {
    const category = String(row.category ?? "");
    if (!category) continue;
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }

  let listQuery = client
    .from("listings")
    .select(
      "id, source_id, category, address, city, state, zip, price, status, is_active, has_image, detail_url, updated_at, external_id",
      { count: "exact" },
    )
    .neq("source_id", "mock");

  if (query.active === "1") listQuery = listQuery.eq("is_active", true);
  if (query.active === "0") listQuery = listQuery.eq("is_active", false);
  if (query.sourceId !== "all") listQuery = listQuery.eq("source_id", query.sourceId);
  if (query.category !== "all") listQuery = listQuery.eq("category", query.category);

  if (query.q) {
    const safe = query.q.replace(/,/g, " ");
    listQuery = listQuery.or(
      [
        `id.ilike.%${safe}%`,
        `external_id.ilike.%${safe}%`,
        `address.ilike.%${safe}%`,
        `city.ilike.%${safe}%`,
        `state.ilike.%${safe}%`,
        `zip.ilike.%${safe}%`,
        `category.ilike.%${safe}%`,
      ].join(","),
    );
  }

  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  const { data: listings, error, count } = await listQuery
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[admin-listings] Supabase query failed:", error.message);
    return null;
  }

  const filteredTotal = count ?? listings?.length ?? 0;
  const totalPages = filteredTotal > 0 ? Math.ceil(filteredTotal / query.pageSize) : 0;

  return {
    available: true,
    totalActive: activeCount ?? 0,
    totalInactive: inactiveCount ?? 0,
    bySource: sourceIds
      .map((sourceId) => ({
        sourceId,
        name: sourceNameById.get(sourceId) ?? sourceId,
        count: bySourceMap.get(sourceId) ?? 0,
      }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count),
    byCategory: [...categoryCounts.entries()]
      .map(([category, catCount]) => ({
        category,
        label: formatCategoryLabel(category),
        count: catCount,
      }))
      .sort((a, b) => b.count - a.count),
    listings: (listings ?? []).map((row) =>
      mapListingRow({
        ...row,
        source_name: sourceNameById.get(String(row.source_id)) ?? row.source_id,
      } as Record<string, unknown>),
    ),
    filteredTotal,
    page: totalPages > 0 ? Math.min(query.page, totalPages) : 1,
    pageSize: query.pageSize,
    totalPages,
    query,
  };
}

export async function fetchAdminListingsData(
  input?: Partial<AdminListingsQuery> | AdminListingsQuery,
): Promise<AdminListingsData> {
  const query = normalizeQuery(input);
  try {
    const fromPg = await fetchViaPostgres(query);
    if (fromPg?.available) return fromPg;

    const fromSupabase = await fetchViaSupabase(query);
    if (fromSupabase?.available) return fromSupabase;
  } catch (error) {
    console.error("[admin-listings] Unexpected failure:", error);
  }
  return emptyData(query);
}
