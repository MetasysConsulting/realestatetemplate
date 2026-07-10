import pg from "pg";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const { Client } = pg;

/** Placeholder seed source — not a real scrape feed. */
const HIDDEN_SOURCE_IDS = new Set(["mock"]);

const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const LISTING_PAGE_SIZE = 1000;

export type ScrapeSourceStat = {
  id: string;
  name: string;
  sourceUrl: string | null;
  lastScrapedAt: string | null;
  newestListingScrapedAt: string | null;
  activeListings: number;
  inactiveListings: number;
  withImage: number;
  isStale: boolean;
};

export type ScrapeCategoryStat = {
  sourceId: string;
  category: string;
  count: number;
};

export type ScrapeAnalytics = {
  available: boolean;
  sources: ScrapeSourceStat[];
  categories: ScrapeCategoryStat[];
  totals: {
    activeListings: number;
    inactiveListings: number;
    withImage: number;
    sourcesWithListings: number;
    staleSources: number;
  };
};

function emptyAnalytics(): ScrapeAnalytics {
  return {
    available: false,
    sources: [],
    categories: [],
    totals: {
      activeListings: 0,
      inactiveListings: 0,
      withImage: 0,
      sourcesWithListings: 0,
      staleSources: 0,
    },
  };
}

function isStale(lastScrapedAt: string | null): boolean {
  if (!lastScrapedAt) return true;
  const ts = Date.parse(lastScrapedAt);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > STALE_AFTER_MS;
}

function buildAnalytics(
  sources: ScrapeSourceStat[],
  categories: ScrapeCategoryStat[],
): ScrapeAnalytics {
  const activeListings = sources.reduce((sum, s) => sum + s.activeListings, 0);
  const inactiveListings = sources.reduce((sum, s) => sum + s.inactiveListings, 0);
  const withImage = sources.reduce((sum, s) => sum + s.withImage, 0);
  const sourcesWithListings = sources.filter((s) => s.activeListings > 0).length;
  const staleSources = sources.filter((s) => s.isStale).length;

  return {
    available: true,
    sources,
    categories,
    totals: {
      activeListings,
      inactiveListings,
      withImage,
      sourcesWithListings,
      staleSources,
    },
  };
}

function createAnalyticsSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  if (!url) return null;

  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  const key = serviceKey || getSupabaseAnonKey();
  if (!key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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
    console.error("[listing-analytics] Postgres query failed:", error);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function fetchViaPostgres(): Promise<ScrapeAnalytics | null> {
  const result = await withPgClient(async (client) => {
    const sourcesResult = await client.query(`
      SELECT
        s.id,
        s.name,
        s.source_url,
        s.last_scraped_at,
        COUNT(l.*) FILTER (WHERE l.is_active) AS active_listings,
        COUNT(l.*) FILTER (WHERE l.is_active IS FALSE) AS inactive_listings,
        COUNT(l.*) FILTER (WHERE l.is_active AND COALESCE(l.has_image, false)) AS with_image,
        MAX(l.scraped_at) AS newest_listing_scraped_at
      FROM listing_sources s
      LEFT JOIN listings l ON l.source_id = s.id
      GROUP BY s.id
      ORDER BY active_listings DESC, s.name ASC
    `);

    const categoriesResult = await client.query(`
      SELECT source_id, category, COUNT(*)::int AS count
      FROM listings
      WHERE is_active = TRUE
      GROUP BY source_id, category
      ORDER BY count DESC, source_id ASC, category ASC
    `);

    return { sourcesResult, categoriesResult };
  });

  if (!result) return null;

  const sources: ScrapeSourceStat[] = result.sourcesResult.rows
    .filter((row) => !HIDDEN_SOURCE_IDS.has(String(row.id)))
    .map((row) => {
      const lastScrapedAt = row.last_scraped_at
        ? new Date(row.last_scraped_at).toISOString()
        : null;
      const newestListingScrapedAt = row.newest_listing_scraped_at
        ? new Date(row.newest_listing_scraped_at).toISOString()
        : null;
      const activeListings = Number(row.active_listings) || 0;

      return {
        id: String(row.id),
        name: String(row.name),
        sourceUrl: row.source_url ? String(row.source_url) : null,
        lastScrapedAt,
        newestListingScrapedAt,
        activeListings,
        inactiveListings: Number(row.inactive_listings) || 0,
        withImage: Number(row.with_image) || 0,
        isStale: isStale(lastScrapedAt) || activeListings === 0,
      };
    });

  const categories: ScrapeCategoryStat[] = result.categoriesResult.rows
    .filter((row) => !HIDDEN_SOURCE_IDS.has(String(row.source_id)))
    .map((row) => ({
      sourceId: String(row.source_id),
      category: String(row.category),
      count: Number(row.count) || 0,
    }));

  return buildAnalytics(sources, categories);
}

async function countListings(
  client: SupabaseClient,
  filters: { sourceId: string; active?: boolean; hasImage?: boolean },
): Promise<number> {
  let query = client
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("source_id", filters.sourceId);

  if (filters.active === true) query = query.eq("is_active", true);
  if (filters.active === false) query = query.eq("is_active", false);
  if (filters.hasImage === true) query = query.eq("has_image", true);

  const { count, error } = await query;
  if (error) {
    console.error("[listing-analytics] Supabase count failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

async function fetchCategoryBreakdown(
  client: SupabaseClient,
): Promise<ScrapeCategoryStat[]> {
  const counts = new Map<string, number>();
  let from = 0;

  while (true) {
    const to = from + LISTING_PAGE_SIZE - 1;
    const { data, error } = await client
      .from("listings")
      .select("source_id, category")
      .eq("is_active", true)
      .range(from, to);

    if (error) {
      console.error("[listing-analytics] Supabase category query failed:", error.message);
      break;
    }
    if (!data?.length) break;

    for (const row of data) {
      const sourceId = String(row.source_id ?? "");
      const category = String(row.category ?? "");
      if (!sourceId || !category || HIDDEN_SOURCE_IDS.has(sourceId)) continue;
      const key = `${sourceId}::${category}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    if (data.length < LISTING_PAGE_SIZE) break;
    from += LISTING_PAGE_SIZE;
  }

  return [...counts.entries()]
    .map(([key, count]) => {
      const [sourceId, category] = key.split("::");
      return { sourceId, category, count };
    })
    .sort((a, b) => b.count - a.count || a.sourceId.localeCompare(b.sourceId));
}

async function fetchViaSupabase(): Promise<ScrapeAnalytics | null> {
  const client = createAnalyticsSupabaseClient();
  if (!client) return null;

  const { data: sourceRows, error } = await client
    .from("listing_sources")
    .select("id, name, source_url, last_scraped_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("[listing-analytics] Supabase sources query failed:", error.message);
    return null;
  }
  if (!sourceRows) return null;

  const visibleSources = sourceRows.filter((row) => !HIDDEN_SOURCE_IDS.has(String(row.id)));

  const sources: ScrapeSourceStat[] = await Promise.all(
    visibleSources.map(async (row) => {
      const id = String(row.id);
      const [activeListings, inactiveListings, withImage] = await Promise.all([
        countListings(client, { sourceId: id, active: true }),
        countListings(client, { sourceId: id, active: false }),
        countListings(client, { sourceId: id, active: true, hasImage: true }),
      ]);

      const lastScrapedAt = row.last_scraped_at
        ? new Date(row.last_scraped_at as string).toISOString()
        : null;

      return {
        id,
        name: String(row.name),
        sourceUrl: row.source_url ? String(row.source_url) : null,
        lastScrapedAt,
        newestListingScrapedAt: null,
        activeListings,
        inactiveListings,
        withImage,
        isStale: isStale(lastScrapedAt) || activeListings === 0,
      };
    }),
  );

  sources.sort(
    (a, b) => b.activeListings - a.activeListings || a.name.localeCompare(b.name),
  );

  const categories = await fetchCategoryBreakdown(client);
  return buildAnalytics(sources, categories);
}

/**
 * Live scrape inventory for admin.
 * Prefers direct Postgres when DATABASE_URL works; falls back to Supabase
 * (same path the public site uses) so Vercel works without a direct DB socket.
 */
export async function fetchScrapeAnalytics(): Promise<ScrapeAnalytics> {
  try {
    const fromPg = await fetchViaPostgres();
    if (fromPg?.available) return fromPg;

    const fromSupabase = await fetchViaSupabase();
    if (fromSupabase?.available) return fromSupabase;
  } catch (error) {
    console.error("[listing-analytics] Unexpected failure:", error);
  }

  return emptyAnalytics();
}

export function formatCategoryLabel(category: string): string {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never synced";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "Unknown";

  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts));
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
