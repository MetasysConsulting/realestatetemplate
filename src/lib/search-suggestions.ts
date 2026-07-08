import "server-only";

import type { SearchSuggestion, SearchSuggestionType } from "@/lib/search-suggestion-types";
import { buildSearchHref } from "@/lib/search-suggestion-types";
import { createSupabaseServerClient, areSiteListingsEnabled, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { matchStateSuggestions, parseLocationQuery } from "@/lib/us-states";

export type { SearchSuggestion, SearchSuggestionType } from "@/lib/search-suggestion-types";
export { buildSearchHref, suggestionTypeLabel } from "@/lib/search-suggestion-types";

const TYPE_RANK: Record<SearchSuggestionType, number> = {
  city: 0,
  zip: 1,
  county: 2,
  state: 3,
  address: 4,
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const suggestionCache = new Map<string, { expiresAt: number; suggestions: SearchSuggestion[] }>();

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatCountyLabel(county: string, state: string): string {
  const cleaned = county.trim();
  const base = titleCase(cleaned.replace(/\s+county$/i, ""));
  return `${base} County, ${state.toUpperCase()}`;
}

function relevanceScore(suggestion: SearchSuggestion, query: string): number {
  const q = query.trim().toLowerCase();
  const label = suggestion.label.toLowerCase();
  const primary = label.split(",")[0]?.trim() ?? label;

  let score = TYPE_RANK[suggestion.type] * 100;

  if (primary === q) score -= 80;
  else if (primary.startsWith(q)) score -= 50;
  else if (label.includes(q)) score -= 20;

  if (suggestion.count) {
    score -= Math.min(30, Math.log10(suggestion.count + 1) * 10);
  }

  return score;
}

function dedupeSuggestions(items: SearchSuggestion[]): SearchSuggestion[] {
  const seenHref = new Set<string>();
  const seenLabel = new Set<string>();
  const result: SearchSuggestion[] = [];

  for (const item of items) {
    const labelKey = `${item.type}:${item.label.toLowerCase()}`;
    if (seenHref.has(item.href) || seenLabel.has(labelKey)) continue;
    seenHref.add(item.href);
    seenLabel.add(labelKey);
    result.push(item);
  }

  return result;
}

function finalizeSuggestions(query: string, suggestions: SearchSuggestion[]): SearchSuggestion[] {
  return dedupeSuggestions(suggestions)
    .sort((a, b) => relevanceScore(a, query) - relevanceScore(b, query))
    .slice(0, 12);
}

async function withPgClient<T>(fn: (client: InstanceType<(typeof import("pg"))["Client"]>) => Promise<T>): Promise<T | null> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;

  const pg = await import("pg");
  const client = new pg.Client({
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

async function fetchSuggestionsFromPostgres(query: string, state: string): Promise<SearchSuggestion[] | null> {
  const pattern = `%${escapeIlike(query)}%`;
  const zipPattern = /^\d+$/.test(query) ? `${query}%` : null;
  const stateVal = state ? state.toUpperCase() : null;

  return withPgClient(async (client) => {
    const stateFilter = stateVal ? "AND state = $2" : "";
    const params = stateVal ? [pattern, stateVal] : [pattern];
    const zipParams = stateVal ? (zipPattern ? [zipPattern, stateVal] : []) : (zipPattern ? [zipPattern] : []);
    const zipStateFilter = stateVal ? "AND state = $2" : "";

    const [cities, counties, zips, addresses] = await Promise.all([
      client.query<{ city: string; state: string; listing_count: number }>(
        `SELECT city, state, COUNT(*)::int AS listing_count
         FROM listings
         WHERE is_active = true AND city ILIKE $1 ${stateFilter}
         GROUP BY city, state
         ORDER BY listing_count DESC, city ASC
         LIMIT 8`,
        params,
      ),
      client.query<{ county: string; state: string; listing_count: number }>(
        `SELECT county, state, COUNT(*)::int AS listing_count
         FROM listings
         WHERE is_active = true AND county IS NOT NULL AND county ILIKE $1 ${stateFilter}
         GROUP BY county, state
         ORDER BY listing_count DESC, county ASC
         LIMIT 5`,
        params,
      ),
      zipPattern
        ? client.query<{ zip: string; city: string; state: string; listing_count: number }>(
            `SELECT zip, city, state, COUNT(*)::int AS listing_count
             FROM listings
             WHERE is_active = true AND zip LIKE $1 ${zipStateFilter}
             GROUP BY zip, city, state
             ORDER BY listing_count DESC, zip ASC
             LIMIT 5`,
            zipParams,
          )
        : Promise.resolve({ rows: [] as { zip: string; city: string; state: string; listing_count: number }[] }),
      client.query<{ address: string; city: string; state: string }>(
        `SELECT DISTINCT ON (address, city, state) address, city, state
         FROM listings
         WHERE is_active = true AND address ILIKE $1 ${stateFilter}
         ORDER BY address, city, state, address ASC
         LIMIT 5`,
        params,
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
        label: formatCountyLabel(row.county, row.state),
        sublabel: `${row.listing_count} listing${row.listing_count === 1 ? "" : "s"}`,
        href: buildSearchHref(row.county.replace(/\s+county$/i, ""), row.state),
        count: row.listing_count,
      });
    }

    for (const row of zips.rows) {
      suggestions.push({
        id: `zip:${row.zip}:${row.city}:${row.state}`,
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

async function fetchSuggestionsFromSupabase(query: string, state: string): Promise<SearchSuggestion[]> {
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

  let dbQuery = client
    .from("listings")
    .select("city, state, zip, county, address")
    .eq("is_active", true)
    .or(clauses.join(","))
    .limit(200);

  if (state) {
    dbQuery = dbQuery.eq("state", state.toUpperCase());
  }

  const { data, error } = await dbQuery;

  if (error || !data) {
    console.error("[search-suggestions] Supabase fallback failed:", error?.message ?? "unknown error");
    return [];
  }

  const cityCounts = new Map<AggregateKey, number>();
  const cityRows: { city: string; state: string; count: number }[] = [];
  const countyRows: { county: string; state: string; count: number }[] = [];
  const zipRows: { zip: string; city: string; state: string; count: number }[] = [];
  const addressRows: { address: string; city: string; state: string }[] = [];
  const addressSeen = new Set<AggregateKey>();

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
      const existing = countyRows.find((item) => `${item.county}|${item.state}` === key);
      if (existing) existing.count += 1;
      else countyRows.push({ county, state, count: 1 });
    }

    if (zip && (/^\d+$/.test(query) ? zip.startsWith(query) : zip.includes(query))) {
      const key = `${zip}|${city}|${state}`;
      const existing = zipRows.find((item) => `${item.zip}|${item.city}|${item.state}` === key);
      if (existing) existing.count += 1;
      else zipRows.push({ zip, city, state, count: 1 });
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
    .slice(0, 8)
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
    .slice(0, 5)
    .forEach((row) => {
      suggestions.push({
        id: `county:${row.county}:${row.state}`,
        type: "county",
        label: formatCountyLabel(row.county, row.state),
        sublabel: `${row.count} listing${row.count === 1 ? "" : "s"}`,
        href: buildSearchHref(row.county.replace(/\s+county$/i, ""), row.state),
        count: row.count,
      });
    });

  zipRows
    .sort((a, b) => b.count - a.count || a.zip.localeCompare(b.zip))
    .slice(0, 5)
    .forEach((row) => {
      suggestions.push({
        id: `zip:${row.zip}:${row.city}:${row.state}`,
        type: "zip",
        label: row.zip,
        sublabel: `${titleCase(row.city)}, ${row.state}`,
        href: buildSearchHref(row.zip),
        count: row.count,
      });
    });

  addressRows.slice(0, 5).forEach((row) => {
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

function appendStateSuggestions(query: string, state: string, suggestions: SearchSuggestion[]): SearchSuggestion[] {
  const stateQuery = state || query;
  const states = matchStateSuggestions(stateQuery, state ? 1 : 4).map((s) => ({
    id: `state:${s.abbr}`,
    type: "state" as const,
    label: s.name,
    sublabel: `${s.abbr} · all listings`,
    href: buildSearchHref(undefined, s.abbr),
  }));

  return [...states, ...suggestions];
}

async function loadSuggestions(q: string, state: string): Promise<SearchSuggestion[]> {
  const fromPostgres = await fetchSuggestionsFromPostgres(q, state);
  const inventorySuggestions = fromPostgres ?? (await fetchSuggestionsFromSupabase(q, state));
  return finalizeSuggestions(q, appendStateSuggestions(q, state, inventorySuggestions));
}

export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { q, state } = parseLocationQuery(trimmed);

  const cacheKey = `${q.toLowerCase()}:${state.toLowerCase()}`;
  const cached = suggestionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.suggestions;
  }

  if (!areSiteListingsEnabled() || !isSupabaseConfigured()) {
    if (state) {
      const match = matchStateSuggestions(state, 1);
      return match.map((s) => ({
        id: `state:${s.abbr}`,
        type: "state",
        label: s.name,
        sublabel: `${s.abbr} · all listings`,
        href: buildSearchHref(undefined, s.abbr),
      }));
    }
    return matchStateSuggestions(q, 6).map((state) => ({
      id: `state:${state.abbr}`,
      type: "state",
      label: state.name,
      sublabel: `${state.abbr} · all listings`,
      href: buildSearchHref(undefined, state.abbr),
    }));
  }

  const suggestions = await loadSuggestions(q, state);
  suggestionCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    suggestions,
  });

  if (suggestionCache.size > 200) {
    const oldestKey = suggestionCache.keys().next().value;
    if (oldestKey) suggestionCache.delete(oldestKey);
  }

  return suggestions;
}
