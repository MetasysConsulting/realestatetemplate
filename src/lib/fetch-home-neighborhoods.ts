import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import {
  buildNeighborhoodHref,
  formatNeighborhoodLabel,
  formatPropertyCount,
  resolveNeighborhoodImage,
  titleCaseCity,
  type HomeNeighborhood,
} from "@/lib/home-neighborhoods";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const { Client } = pg;

const NEIGHBORHOOD_LIMIT = 8;

type CityCountRow = {
  city: string;
  state: string;
  count: number;
  imageUrl: string | null;
};

function mapNeighborhood(row: CityCountRow): HomeNeighborhood {
  const state = row.state.toUpperCase();
  const city = titleCaseCity(row.city);
  return {
    id: `${city.toLowerCase().replace(/\s+/g, "-")}-${state.toLowerCase()}`,
    city: formatNeighborhoodLabel(city, state),
    state,
    count: row.count,
    countLabel: formatPropertyCount(row.count),
    imageUrl: resolveNeighborhoodImage(city, state, row.imageUrl),
    href: buildNeighborhoodHref(city, state),
  };
}

async function fetchViaPostgres(): Promise<CityCountRow[] | null> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8_000,
  });

  try {
    await client.connect();
    const result = await client.query(`
      WITH city_counts AS (
        SELECT
          lower(btrim(city)) AS city_key,
          upper(btrim(state)) AS state,
          COUNT(*)::int AS count
        FROM listings
        WHERE is_active = TRUE
          AND btrim(city) <> ''
          AND btrim(state) <> ''
          AND char_length(btrim(state)) = 2
        GROUP BY 1, 2
        ORDER BY count DESC
        LIMIT $1
      )
      SELECT
        initcap(c.city_key) AS city,
        c.state,
        c.count,
        (
          SELECT l.image_url
          FROM listings l
          WHERE l.is_active = TRUE
            AND lower(btrim(l.city)) = c.city_key
            AND upper(btrim(l.state)) = c.state
            AND COALESCE(l.has_image, false) = TRUE
            AND l.image_url IS NOT NULL
            AND btrim(l.image_url) <> ''
          LIMIT 1
        ) AS image_url
      FROM city_counts c
      ORDER BY c.count DESC
    `, [NEIGHBORHOOD_LIMIT]);

    return result.rows.map((row) => ({
      city: String(row.city),
      state: String(row.state),
      count: Number(row.count) || 0,
      imageUrl: row.image_url ? String(row.image_url) : null,
    }));
  } catch (error) {
    console.error("[home-neighborhoods] Postgres query failed:", error);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function fetchViaSupabase(): Promise<CityCountRow[] | null> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const counts = new Map<string, { city: string; state: string; count: number; imageUrl: string | null }>();
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await client
      .from("listings")
      .select("city, state, image_url, has_image")
      .eq("is_active", true)
      .range(from, to);

    if (error) {
      console.error("[home-neighborhoods] Supabase query failed:", error.message);
      return null;
    }
    if (!data?.length) break;

    for (const row of data) {
      const cityRaw = String(row.city ?? "").trim();
      const state = String(row.state ?? "").trim().toUpperCase();
      if (!cityRaw || state.length !== 2) continue;
      const keyName = `${cityRaw.toLowerCase()}|${state}`;
      const existing = counts.get(keyName);
      if (existing) {
        existing.count += 1;
        if (!existing.imageUrl && row.has_image && row.image_url) {
          existing.imageUrl = String(row.image_url);
        }
      } else {
        counts.set(keyName, {
          city: cityRaw,
          state,
          count: 1,
          imageUrl: row.has_image && row.image_url ? String(row.image_url) : null,
        });
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
    // Cap scan for safety on huge tables — top cities appear early enough in practice
    if (from >= 20_000) break;
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
    .slice(0, NEIGHBORHOOD_LIMIT);
}

/** Top cities by active listing count for the homepage neighborhoods carousel. */
export async function fetchHomeNeighborhoods(): Promise<HomeNeighborhood[]> {
  try {
    const rows = (await fetchViaPostgres()) ?? (await fetchViaSupabase()) ?? [];
    return rows.filter((row) => row.count > 0).map(mapNeighborhood);
  } catch (error) {
    console.error("[home-neighborhoods] Unexpected failure:", error);
    return [];
  }
}
