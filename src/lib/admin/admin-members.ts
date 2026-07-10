import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { getSupabaseUrl } from "@/lib/supabase/env";
import {
  ADMIN_MEMBERS_DEFAULT_PAGE_SIZE,
  escapeMemberIlike,
  parseAdminMembersQuery,
  type AdminMember,
  type AdminMembersData,
  type AdminMembersQuery,
} from "@/lib/admin/admin-members-types";

export type { AdminMember, AdminMembersData, AdminMembersQuery } from "@/lib/admin/admin-members-types";
export {
  formatMemberCount,
  buildAdminMembersHref,
  parseAdminMembersQuery,
} from "@/lib/admin/admin-members-types";

const { Client } = pg;

function emptyData(query?: AdminMembersQuery): AdminMembersData {
  const q = query ?? parseAdminMembersQuery({});
  return {
    available: false,
    total: 0,
    confirmedTotal: 0,
    signedIn30dTotal: 0,
    unlockIntentsTotal: 0,
    filteredTotal: 0,
    page: q.page,
    pageSize: q.pageSize,
    totalPages: 0,
    query: q,
    members: [],
  };
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

function normalizeQuery(
  input?: Partial<AdminMembersQuery> | AdminMembersQuery,
): AdminMembersQuery {
  if (!input) return parseAdminMembersQuery({});
  return {
    q: (input.q ?? "").trim(),
    page: Math.max(1, Math.floor(Number(input.page) || 1)),
    pageSize: Math.min(
      100,
      Math.max(10, Math.floor(Number(input.pageSize) || ADMIN_MEMBERS_DEFAULT_PAGE_SIZE)),
    ),
  };
}

function getServiceKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    undefined
  );
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

async function fetchViaPostgres(query: AdminMembersQuery): Promise<AdminMembersData | null> {
  return withPgClient(async (client) => {
    const authExists = await client.query(`SELECT to_regclass('auth.users') AS t`);
    if (!authExists.rows[0]?.t) return emptyData(query);

    const flags = await client.query(`
      SELECT
        to_regclass('public.profiles') IS NOT NULL AS has_profiles,
        to_regclass('public.site_analytics_events') IS NOT NULL AS has_analytics
    `);
    const hasProfiles = Boolean(flags.rows[0]?.has_profiles);
    const hasAnalytics = Boolean(flags.rows[0]?.has_analytics);

    const params: unknown[] = [];
    const whereParts: string[] = ["TRUE"];

    if (query.q) {
      const pattern = `%${escapeMemberIlike(query.q)}%`;
      params.push(pattern);
      const idx = params.length;
      if (hasProfiles) {
        whereParts.push(`(
          coalesce(p.email, u.email, '') ILIKE $${idx} ESCAPE '\\'
          OR coalesce(p.full_name, '') ILIKE $${idx} ESCAPE '\\'
          OR coalesce(p.phone, '') ILIKE $${idx} ESCAPE '\\'
        )`);
      } else {
        whereParts.push(`coalesce(u.email, '') ILIKE $${idx} ESCAPE '\\'`);
      }
    }

    const whereSql = whereParts.join(" AND ");
    const offset = (query.page - 1) * query.pageSize;

    const fromJoin = hasProfiles
      ? `FROM auth.users u LEFT JOIN profiles p ON p.id = u.id`
      : `FROM auth.users u`;

    const analyticsJoin = hasAnalytics
      ? `
        LEFT JOIN (
          SELECT
            e.user_id,
            COUNT(*) FILTER (WHERE e.event_name = 'unlock_intent')::int AS unlock_intents,
            COUNT(*) FILTER (WHERE e.event_name = 'page_view')::int AS page_views
          FROM site_analytics_events e
          WHERE e.user_id IS NOT NULL
          GROUP BY e.user_id
        ) a ON a.user_id = u.id
      `
      : "";

    const selectCols = hasProfiles
      ? `
        u.id,
        coalesce(p.email, u.email, '') AS email,
        p.full_name,
        p.phone,
        coalesce(p.created_at, u.created_at) AS created_at,
        coalesce(p.updated_at, u.updated_at) AS updated_at,
        u.last_sign_in_at,
        (u.email_confirmed_at IS NOT NULL) AS email_confirmed,
        ${hasAnalytics ? "coalesce(a.unlock_intents, 0)" : "0"} AS unlock_intents,
        ${hasAnalytics ? "coalesce(a.page_views, 0)" : "0"} AS page_views
      `
      : `
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
      `;

    const orderBy = hasProfiles
      ? "ORDER BY coalesce(p.created_at, u.created_at) DESC"
      : "ORDER BY u.created_at DESC";

    const listParams = [...params, query.pageSize, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const [totals, filtered, rows] = await Promise.all([
      client.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE u.email_confirmed_at IS NOT NULL)::int AS confirmed,
          COUNT(*) FILTER (
            WHERE u.last_sign_in_at IS NOT NULL
              AND u.last_sign_in_at >= NOW() - INTERVAL '30 days'
          )::int AS signed_in_30d
        FROM auth.users u
      `),
      client.query(
        `
        SELECT COUNT(*)::int AS total
        ${fromJoin}
        WHERE ${whereSql}
      `,
        params,
      ),
      client.query(
        `
        SELECT ${selectCols}
        ${fromJoin}
        ${analyticsJoin}
        WHERE ${whereSql}
        ${orderBy}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
        listParams,
      ),
    ]);

    let unlockIntentsTotal = 0;
    if (hasAnalytics) {
      const unlocks = await client.query(`
        SELECT COUNT(*)::int AS n
        FROM site_analytics_events
        WHERE event_name = 'unlock_intent' AND user_id IS NOT NULL
      `);
      unlockIntentsTotal = Number(unlocks.rows[0]?.n) || 0;
    }

    const filteredTotal = Number(filtered.rows[0]?.total) || 0;
    const totalPages = filteredTotal > 0 ? Math.ceil(filteredTotal / query.pageSize) : 0;
    const page = totalPages > 0 ? Math.min(query.page, totalPages) : 1;

    return {
      available: true,
      total: Number(totals.rows[0]?.total) || 0,
      confirmedTotal: Number(totals.rows[0]?.confirmed) || 0,
      signedIn30dTotal: Number(totals.rows[0]?.signed_in_30d) || 0,
      unlockIntentsTotal,
      filteredTotal,
      page,
      pageSize: query.pageSize,
      totalPages,
      query: { ...query, page },
      members: rows.rows.map((row) => mapMember(row as Record<string, unknown>)),
    };
  });
}

async function fetchViaRpc(query: AdminMembersQuery): Promise<AdminMembersData | null> {
  const url = getSupabaseUrl();
  const key = getServiceKey();
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
  if (raw.available === false) return emptyData(query);

  let members = Array.isArray(raw.members)
    ? raw.members.map((row) => mapMember(row as Record<string, unknown>))
    : [];

  const q = query.q.toLowerCase();
  if (q) {
    members = members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone ?? "").toLowerCase().includes(q),
    );
  }

  const filteredTotal = members.length;
  const totalPages = filteredTotal > 0 ? Math.ceil(filteredTotal / query.pageSize) : 0;
  const page = totalPages > 0 ? Math.min(query.page, totalPages) : 1;
  const start = (page - 1) * query.pageSize;
  const pageMembers = members.slice(start, start + query.pageSize);

  const allMembers = Array.isArray(raw.members)
    ? raw.members.map((row) => mapMember(row as Record<string, unknown>))
    : [];

  return {
    available: true,
    total: Number(raw.total) || allMembers.length,
    confirmedTotal: allMembers.filter((m) => m.emailConfirmed).length,
    signedIn30dTotal: allMembers.filter((m) => {
      if (!m.lastSignInAt) return false;
      const ts = Date.parse(m.lastSignInAt);
      return !Number.isNaN(ts) && Date.now() - ts < 30 * 24 * 60 * 60 * 1000;
    }).length,
    unlockIntentsTotal: allMembers.reduce((sum, m) => sum + m.unlockIntents, 0),
    filteredTotal,
    page,
    pageSize: query.pageSize,
    totalPages,
    query: { ...query, page },
    members: pageMembers,
  };
}

export async function fetchAdminMembersData(
  input?: Partial<AdminMembersQuery> | AdminMembersQuery,
): Promise<AdminMembersData> {
  const query = normalizeQuery(input);
  try {
    const fromPg = await fetchViaPostgres(query);
    if (fromPg?.available) return fromPg;

    const fromRpc = await fetchViaRpc(query);
    if (fromRpc?.available) return fromRpc;
  } catch (error) {
    console.error("[admin-members] Unexpected failure:", error);
  }
  return emptyData(query);
}
