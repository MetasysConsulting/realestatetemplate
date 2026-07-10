import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { AdminMember, AdminMembersData } from "@/lib/admin/admin-members-types";

export type { AdminMember, AdminMembersData } from "@/lib/admin/admin-members-types";

const { Client } = pg;

function emptyData(): AdminMembersData {
  return { available: false, total: 0, members: [] };
}

function toIso(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  const raw = String(value);
  const ts = Date.parse(raw);
  if (Number.isNaN(ts)) return null;
  return new Date(ts).toISOString();
}

function mapMember(row: Record<string, unknown>): AdminMember {
  const email = String(row.email ?? "").trim();
  const fullNameRaw = String(row.full_name ?? row.fullName ?? "").trim();
  const createdAt =
    toIso(row.created_at) ?? toIso(row.createdAt) ?? new Date(0).toISOString();
  const updatedAt =
    toIso(row.updated_at) ?? toIso(row.updatedAt) ?? createdAt;

  return {
    id: String(row.id),
    email,
    fullName: fullNameRaw || email.split("@")[0] || "Member",
    phone: row.phone ? String(row.phone).trim() || null : null,
    createdAt,
    updatedAt,
    lastSignInAt: toIso(row.last_sign_in_at) ?? toIso(row.lastSignInAt),
    emailConfirmed: Boolean(row.email_confirmed ?? row.emailConfirmed),
    unlockIntents: Number(row.unlock_intents ?? row.unlockIntents) || 0,
    pageViews: Number(row.page_views ?? row.pageViews) || 0,
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
    console.error("[admin-members] Postgres query failed:", error);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function fetchViaPostgres(): Promise<AdminMembersData | null> {
  return withPgClient(async (client) => {
    const authExists = await client.query(`SELECT to_regclass('auth.users') AS t`);
    if (!authExists.rows[0]?.t) return emptyData();

    const flags = await client.query(`
      SELECT
        to_regclass('public.profiles') IS NOT NULL AS has_profiles,
        to_regclass('public.site_analytics_events') IS NOT NULL AS has_analytics
    `);
    const hasProfiles = Boolean(flags.rows[0]?.has_profiles);
    const hasAnalytics = Boolean(flags.rows[0]?.has_analytics);

    let sql: string;
    if (hasProfiles && hasAnalytics) {
      sql = `
        SELECT
          u.id,
          coalesce(p.email, u.email, '') AS email,
          p.full_name,
          p.phone,
          coalesce(p.created_at, u.created_at) AS created_at,
          coalesce(p.updated_at, u.updated_at) AS updated_at,
          u.last_sign_in_at,
          (u.email_confirmed_at IS NOT NULL) AS email_confirmed,
          coalesce(a.unlock_intents, 0) AS unlock_intents,
          coalesce(a.page_views, 0) AS page_views
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
        LEFT JOIN (
          SELECT
            e.user_id,
            COUNT(*) FILTER (WHERE e.event_name = 'unlock_intent')::int AS unlock_intents,
            COUNT(*) FILTER (WHERE e.event_name = 'page_view')::int AS page_views
          FROM site_analytics_events e
          WHERE e.user_id IS NOT NULL
          GROUP BY e.user_id
        ) a ON a.user_id = u.id
        ORDER BY coalesce(p.created_at, u.created_at) DESC
      `;
    } else if (hasProfiles) {
      sql = `
        SELECT
          u.id,
          coalesce(p.email, u.email, '') AS email,
          p.full_name,
          p.phone,
          coalesce(p.created_at, u.created_at) AS created_at,
          coalesce(p.updated_at, u.updated_at) AS updated_at,
          u.last_sign_in_at,
          (u.email_confirmed_at IS NOT NULL) AS email_confirmed,
          0 AS unlock_intents,
          0 AS page_views
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
        ORDER BY coalesce(p.created_at, u.created_at) DESC
      `;
    } else {
      sql = `
        SELECT
          u.id,
          coalesce(u.email, '') AS email,
          coalesce(
            nullif(btrim(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')), ''),
            split_part(coalesce(u.email, ''), '@', 1),
            'Member'
          ) AS full_name,
          NULL::text AS phone,
          u.created_at,
          u.updated_at,
          u.last_sign_in_at,
          (u.email_confirmed_at IS NOT NULL) AS email_confirmed,
          0 AS unlock_intents,
          0 AS page_views
        FROM auth.users u
        ORDER BY u.created_at DESC
      `;
    }

    const result = await client.query(sql);
    const members = result.rows.map((row) => mapMember(row as Record<string, unknown>));
    return {
      available: true,
      total: members.length,
      members,
    };
  });
}

async function fetchViaRpc(): Promise<AdminMembersData | null> {
  const url = getSupabaseUrl();
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    getSupabaseAnonKey();
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.rpc("get_admin_members");
  if (error) {
    console.error("[admin-members] RPC failed:", error.message);
    return null;
  }
  if (!data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  if (raw.available === false) return emptyData();

  const members = Array.isArray(raw.members)
    ? raw.members.map((row) => mapMember(row as Record<string, unknown>))
    : [];

  return {
    available: true,
    total: Number(raw.total) || members.length,
    members,
  };
}

export async function fetchAdminMembersData(): Promise<AdminMembersData> {
  try {
    const fromPg = await fetchViaPostgres();
    if (fromPg?.available) return fromPg;

    const fromRpc = await fetchViaRpc();
    if (fromRpc?.available) return fromRpc;
  } catch (error) {
    console.error("[admin-members] Unexpected failure:", error);
  }
  return emptyData();
}
