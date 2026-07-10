import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { escapeIlikePattern } from "@/lib/admin/admin-listings-types";
import type { AdminSearchSuggestResult } from "@/lib/admin/admin-search-types";

export type {
  AdminSearchSuggestion,
  AdminSearchSuggestResult,
} from "@/lib/admin/admin-search-types";

const { Client } = pg;

function emptyResult(q: string): AdminSearchSuggestResult {
  return {
    listings: [],
    members: [],
    seeAllListingsHref: q ? `/admin/listings?q=${encodeURIComponent(q)}` : "/admin/listings",
  };
}

async function withPgClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T | null> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 6_000,
  });

  try {
    await client.connect();
    return await fn(client);
  } catch (error) {
    console.error("[admin-search] Postgres query failed:", error);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function formatPrice(price: number): string {
  if (!price || price <= 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

async function suggestViaPostgres(q: string): Promise<AdminSearchSuggestResult | null> {
  return withPgClient(async (client) => {
    const pattern = `%${escapeIlikePattern(q)}%`;

    const [listings, members] = await Promise.all([
      client.query(
        `
        SELECT
          l.id,
          l.address,
          l.city,
          l.state,
          l.zip,
          l.price,
          coalesce(s.name, l.source_id) AS source_name
        FROM listings l
        LEFT JOIN listing_sources s ON s.id = l.source_id
        WHERE l.source_id IS DISTINCT FROM 'mock'
          AND (
            l.id ILIKE $1 ESCAPE '\\'
            OR l.external_id ILIKE $1 ESCAPE '\\'
            OR l.address ILIKE $1 ESCAPE '\\'
            OR l.city ILIKE $1 ESCAPE '\\'
            OR l.state ILIKE $1 ESCAPE '\\'
            OR l.zip ILIKE $1 ESCAPE '\\'
            OR coalesce(s.name, '') ILIKE $1 ESCAPE '\\'
          )
        ORDER BY l.is_active DESC, l.updated_at DESC NULLS LAST
        LIMIT 6
      `,
        [pattern],
      ),
      client.query(
        `
        SELECT
          u.id,
          coalesce(nullif(btrim(p.full_name), ''), split_part(coalesce(p.email, u.email, ''), '@', 1), 'Member') AS full_name,
          coalesce(p.email, u.email, '') AS email
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
        WHERE coalesce(p.email, u.email, '') ILIKE $1 ESCAPE '\\'
           OR coalesce(p.full_name, '') ILIKE $1 ESCAPE '\\'
           OR coalesce(p.phone, '') ILIKE $1 ESCAPE '\\'
        ORDER BY coalesce(p.created_at, u.created_at) DESC
        LIMIT 5
      `,
        [pattern],
      ),
    ]);

    return {
      listings: listings.rows.map((row) => {
        const price = formatPrice(Number(row.price) || 0);
        const place = [row.city, row.state].filter(Boolean).join(", ");
        return {
          id: String(row.id),
          type: "listing" as const,
          label: String(row.address || place || row.id),
          sublabel: [place, row.source_name, price].filter(Boolean).join(" · "),
          href: `/admin/listings/${encodeURIComponent(String(row.id))}`,
        };
      }),
      members: members.rows.map((row) => ({
        id: String(row.id),
        type: "member" as const,
        label: String(row.full_name || row.email || "Member"),
        sublabel: String(row.email || ""),
        href: `/admin/members?q=${encodeURIComponent(String(row.email || row.full_name || ""))}`,
      })),
      seeAllListingsHref: `/admin/listings?q=${encodeURIComponent(q)}`,
    };
  });
}

async function suggestViaSupabase(q: string): Promise<AdminSearchSuggestResult | null> {
  const url = getSupabaseUrl();
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    getSupabaseAnonKey();
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const safe = q.replace(/,/g, " ");
  const { data: listings } = await client
    .from("listings")
    .select("id, address, city, state, zip, price, source_id")
    .neq("source_id", "mock")
    .or(
      [
        `id.ilike.%${safe}%`,
        `external_id.ilike.%${safe}%`,
        `address.ilike.%${safe}%`,
        `city.ilike.%${safe}%`,
        `state.ilike.%${safe}%`,
        `zip.ilike.%${safe}%`,
      ].join(","),
    )
    .order("updated_at", { ascending: false })
    .limit(6);

  const { data: profiles } = await client
    .from("profiles")
    .select("id, full_name, email, phone")
    .or(
      [
        `email.ilike.%${safe}%`,
        `full_name.ilike.%${safe}%`,
        `phone.ilike.%${safe}%`,
      ].join(","),
    )
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    listings: (listings ?? []).map((row) => {
      const price = formatPrice(Number(row.price) || 0);
      const place = [row.city, row.state].filter(Boolean).join(", ");
      return {
        id: String(row.id),
        type: "listing" as const,
        label: String(row.address || place || row.id),
        sublabel: [place, row.source_id, price].filter(Boolean).join(" · "),
        href: `/admin/listings/${encodeURIComponent(String(row.id))}`,
      };
    }),
    members: (profiles ?? []).map((row) => ({
      id: String(row.id),
      type: "member" as const,
      label: String(row.full_name || row.email || "Member"),
      sublabel: String(row.email || ""),
      href: `/admin/members?q=${encodeURIComponent(String(row.email || row.full_name || ""))}`,
    })),
    seeAllListingsHref: `/admin/listings?q=${encodeURIComponent(q)}`,
  };
}

export async function fetchAdminSearchSuggestions(
  rawQuery: string,
): Promise<AdminSearchSuggestResult> {
  const q = rawQuery.trim();
  if (q.length < 2) return emptyResult(q);

  try {
    const fromPg = await suggestViaPostgres(q);
    if (fromPg) return fromPg;

    const fromSb = await suggestViaSupabase(q);
    if (fromSb) return fromSb;
  } catch (error) {
    console.error("[admin-search] Unexpected failure:", error);
  }

  return emptyResult(q);
}
