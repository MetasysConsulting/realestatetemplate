import pg from "pg";
import { createSupabaseServerClient, areSiteListingsEnabled, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { matchStateSuggestions } from "@/lib/us-states";

const { Client } = pg;

export type SearchSuggestionType = "city" | "county" | "zip" | "state" | "address";

export type SearchSuggestion = {
  id: string;
  type: SearchSuggestionType;
  label: string;
  sublabel?: string;
  href: string;
  count?: number;
};

const TYPE_LABELS: Record<SearchSuggestionType, string> = {
  city: "Cities",
  county: "Counties",
  zip: "ZIP codes",
  state: "States",
  address: "Addresses",
};

export function suggestionTypeLabel(type: SearchSuggestionType): string {
  return TYPE_LABELS[type];
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function buildSearchHref(q?: string, state?: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (state) params.set("state", state);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

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
    console.error("[search-suggestions] Postgres query failed:", error);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function fetchSuggestionsFromPostgres(query: string): Promise<SearchSuggestion[] | null> {
  const pattern = `%${escapeIlike(query)}%`;
  const zipPattern = /^\d+$/.test(query) ? `${query}%` : null;

  return withPgClient(async (client) => {
    const [cities, counties, zips, addresses] = await Promise.all([
      client.query<{ city: string; state: string; listing_count: number }>(
        `SELECT city, state, COUNT(*)::int AS listing_count
         FROM listings
         WHERE is_active = true AND city ILIKE $1
         GROUP BY city, state
         ORDER BY listing_count DESC, city ASC
         LIMIT 6`,
        [pattern],
      ),
      client.query<{ county: string; state: string; listing_count: number }>(
        `SELECT county, state, COUNT(*)::int AS listing_count
         FROM listings
         WHERE is_active = true AND county IS NOT NULL AND county ILIKE $1
         GROUP BY county, state
         ORDER BY listing_count DESC, county ASC
         LIMIT 4`,
        [pattern],
      ),
      zipPattern
        ? client.query<{ zip: string; city: string; state: string; listing_count: number }>(
            `SELECT zip, city, state, COUNT(*)::int AS listing_count
             FROM listings
             WHERE is_active = true AND zip LIKE $1
             GROUP BY zip, city, state
             ORDER BY listing_count DESC, zip ASC
             LIMIT 4`,
            [zipPattern],
          )
        : Promise.resolve({ rows: [] as { zip: string; city: string; state: string; listing_count: number }[] }),
      client.query<{ address: string; city: string; state: string }>(
        `SELECT DISTINCT ON (address, city, state) address, city, state
         FROM listings
         WHERE is_active = true AND address ILIKE $1
         ORDER BY address, city, state
         LIMIT 4`,
        [pattern],
      ),
    ]);

    const suggestions: SearchSuggestion[] = [];

    for (const row of cities.rows) {
      suggestions.push({
        id: `city:${row.city}:${row.state}`,
        type: "city",
        label: `${titleCase(row.city)}, ${row.state.toUpperCase()}`,
        sublabel: `${row.listing_count} listing${row.listing_count === 1 ? "" : "s"}`,
        href: buildSearchHref(row.city, row.state),
        count: row.listing_count,
      });
    }

    for (const row of counties.rows) {
      suggestions.push({
        id: `county:${row.county}:${row.state}`,
        type: "county",
        label: `${titleCase(row.county)} County, ${row.state.toUpperCase()}`,
        sublabel: `${row.listing_count} listing${row.listing_count === 1 ? "" : "s"}`,
        href: buildSearchHref(row.county, row.state),
        count: row.listing_count,
      });
    }

    for (const row of zips.rows) {
      suggestions.push({
        id: `zip:${row.zip}`,
        type: "zip",
        label: row.zip,
        sublabel: `${titleCase(row.city)}, ${row.state.toUpperCase()}`,
        href: buildSearchHref(row.zip),
        count: row.listing_count,
      });
    }

    for (const row of addresses.rows) {
      suggestions.push({
        id: `address:${row.address}:${row.city}:${row.state}`,
        type: "address",
        label: row.address,
        sublabel: `${titleCase(row.city)}, ${row.state.toUpperCase()}`,
        href: buildSearchHref(row.address, row.state),
      });
    }

    return suggestions;
  });
}

type AggregateKey = string;

function bumpCount(map: Map<AggregateKey, number>, key: AggregateKey): number {
  map.set(key, (map.get(key) ?? 0) + 1);
  return map.get(key)!;
}

async function fetchSuggestionsFromSupabase(query: string): Promise<SearchSuggestion[]> {
  const client = createSupabaseServerClient();
  if (!client) return [];

  const escaped = escapeIlike(query);
  const clauses = [
    `city.ilike.%${escaped}%`,
    `county.ilike.%${escaped}%`,
    `address.ilike.%${escaped}%`,
  ];
  if (/^\d+$/.test(query)) {
    clauses.push(`zip.ilike.${query}%`);
  }

  const { data, error } = await client
    .from("listings")
    .select("city, state, zip, county, address")
    .eq("is_active", true)
    .or(clauses.join(","))
    .limit(120);

  if (error || !data) {
    console.error("[search-suggestions] Supabase fallback failed:", error?.message ?? "unknown error");
    return [];
  }

  const cityCounts = new Map<AggregateKey, number>();
  const countyCounts = new Map<AggregateKey, { county: string; state: string; count: number }>();
  const zipCounts = new Map<AggregateKey, { zip: string; city: string; state: string; count: number }>();
  const addressSeen = new Set<AggregateKey>();

  const cityRows: { city: string; state: string; count: number }[] = [];
  const countyRows: { county: string; state: string; count: number }[] = [];
  const zipRows: { zip: string; city: string; state: string; count: number }[] = [];
  const addressRows: { address: string; city: string; state: string }[] = [];

  for (const row of data) {
    const city = String(row.city ?? "").trim();
    const state = String(row.state ?? "").trim().toUpperCase();
    const county = String(row.county ?? "").trim();
    const zip = String(row.zip ?? "").trim();
    const address = String(row.address ?? "").trim();
    const qLower = query.toLowerCase();

    if (city && city.toLowerCase().includes(qLower)) {
      const key = `${city}|${state}`;
      const count = bumpCount(cityCounts, key);
      const existing = cityRows.find((item) => `${item.city}|${item.state}` === key);
      if (existing) existing.count = count;
      else cityRows.push({ city, state, count });
    }

    if (county && county.toLowerCase().includes(qLower)) {
      const key = `${county}|${state}`;
      const next = (countyCounts.get(key)?.count ?? 0) + 1;
      countyCounts.set(key, { county, state, count: next });
      const existing = countyRows.find((item) => `${item.county}|${item.state}` === key);
      if (existing) existing.count = next;
      else countyRows.push({ county, state, count: next });
    }

    if (zip && (/^\d+$/.test(query) ? zip.startsWith(query) : zip.includes(query))) {
      const key = `${zip}|${city}|${state}`;
      const next = (zipCounts.get(key)?.count ?? 0) + 1;
      zipCounts.set(key, { zip, city, state, count: next });
      const existing = zipRows.find((item) => `${item.zip}|${item.city}|${item.state}` === key);
      if (existing) existing.count = next;
      else zipRows.push({ zip, city, state, count: next });
    }

    if (address && address.toLowerCase().includes(qLower)) {
      const key = `${address}|${city}|${state}`;
      if (!addressSeen.has(key)) {
        addressSeen.add(key);
        addressRows.push({ address, city, state });
      }
    }
  }

  const suggestions: SearchSuggestion[] = [];

  cityRows
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
    .slice(0, 6)
    .forEach((row) => {
      suggestions.push({
        id: `city:${row.city}:${row.state}`,
        type: "city",
        label: `${titleCase(row.city)}, ${row.state}`,
        sublabel: `${row.count} listing${row.count === 1 ? "" : "s"}`,
        href: buildSearchHref(row.city, row.state),
        count: row.count,
      });
    });

  countyRows
    .sort((a, b) => b.count - a.count || a.county.localeCompare(b.county))
    .slice(0, 4)
    .forEach((row) => {
      suggestions.push({
        id: `county:${row.county}:${row.state}`,
        type: "county",
        label: `${titleCase(row.county)} County, ${row.state}`,
        sublabel: `${row.count} listing${row.count === 1 ? "" : "s"}`,
        href: buildSearchHref(row.county, row.state),
        count: row.count,
      });
    });

  zipRows
    .sort((a, b) => b.count - a.count || a.zip.localeCompare(b.zip))
    .slice(0, 4)
    .forEach((row) => {
      suggestions.push({
        id: `zip:${row.zip}`,
        type: "zip",
        label: row.zip,
        sublabel: `${titleCase(row.city)}, ${row.state}`,
        href: buildSearchHref(row.zip),
        count: row.count,
      });
    });

  addressRows.slice(0, 4).forEach((row) => {
    suggestions.push({
      id: `address:${row.address}:${row.city}:${row.state}`,
      type: "address",
      label: row.address,
      sublabel: `${titleCase(row.city)}, ${row.state}`,
      href: buildSearchHref(row.address, row.state),
    });
  });

  return suggestions;
}

function appendStateSuggestions(query: string, suggestions: SearchSuggestion[]): SearchSuggestion[] {
  const states = matchStateSuggestions(query, 3).map((state) => ({
    id: `state:${state.abbr}`,
    type: "state" as const,
    label: state.name,
    sublabel: state.abbr,
    href: buildSearchHref(undefined, state.abbr),
  }));

  const seen = new Set(suggestions.map((item) => item.id));
  const merged = [...states.filter((item) => !seen.has(item.id)), ...suggestions];
  return merged.slice(0, 12);
}

export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  if (!areSiteListingsEnabled() || !isSupabaseConfigured()) {
    return matchStateSuggestions(trimmed, 5).map((state) => ({
      id: `state:${state.abbr}`,
      type: "state",
      label: state.name,
      sublabel: state.abbr,
      href: buildSearchHref(undefined, state.abbr),
    }));
  }

  const fromPostgres = await fetchSuggestionsFromPostgres(trimmed);
  const inventorySuggestions = fromPostgres ?? (await fetchSuggestionsFromSupabase(trimmed));
  return appendStateSuggestions(trimmed, inventorySuggestions);
}
