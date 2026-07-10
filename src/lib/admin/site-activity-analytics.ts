import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { getSupabaseUrl } from "@/lib/supabase/env";

const { Client } = pg;

export type SiteActivitySummary = {
  available: boolean;
  visitorsToday: number;
  visitors7d: number;
  pageViewsToday: number;
  pageViews7d: number;
  loginEvents7d: number;
  signupEvents7d: number;
  unlockIntents7d: number;
  topPages: Array<{ path: string; views: number }>;
  recentEvents: Array<{
    id: string;
    createdAt: string;
    eventName: string;
    path: string;
  }>;
};

function emptySummary(): SiteActivitySummary {
  return {
    available: false,
    visitorsToday: 0,
    visitors7d: 0,
    pageViewsToday: 0,
    pageViews7d: 0,
    loginEvents7d: 0,
    signupEvents7d: 0,
    unlockIntents7d: 0,
    topPages: [],
    recentEvents: [],
  };
}

function getServiceKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY
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
    console.error("[site-activity] Postgres query failed:", error);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function fetchViaPostgres(): Promise<SiteActivitySummary | null> {
  return withPgClient(async (client) => {
    const exists = await client.query(`
      SELECT to_regclass('public.site_analytics_events') AS table_name
    `);
    if (!exists.rows[0]?.table_name) return emptySummary();

    const [kpis, topPages, recent] = await Promise.all([
      client.query(`
        SELECT
          COUNT(DISTINCT visitor_id) FILTER (
            WHERE event_name = 'page_view'
              AND created_at >= date_trunc('day', NOW())
              AND visitor_id <> ''
          )::int AS visitors_today,
          COUNT(DISTINCT visitor_id) FILTER (
            WHERE event_name = 'page_view'
              AND created_at >= NOW() - INTERVAL '7 days'
              AND visitor_id <> ''
          )::int AS visitors_7d,
          COUNT(*) FILTER (
            WHERE event_name = 'page_view'
              AND created_at >= date_trunc('day', NOW())
          )::int AS page_views_today,
          COUNT(*) FILTER (
            WHERE event_name = 'page_view'
              AND created_at >= NOW() - INTERVAL '7 days'
          )::int AS page_views_7d,
          COUNT(*) FILTER (
            WHERE event_name = 'login_success'
              AND created_at >= NOW() - INTERVAL '7 days'
          )::int AS login_events_7d,
          COUNT(*) FILTER (
            WHERE event_name = 'signup_success'
              AND created_at >= NOW() - INTERVAL '7 days'
          )::int AS signup_events_7d,
          COUNT(*) FILTER (
            WHERE event_name = 'unlock_intent'
              AND created_at >= NOW() - INTERVAL '7 days'
          )::int AS unlock_intents_7d
        FROM site_analytics_events
      `),
      client.query(`
        SELECT path, COUNT(*)::int AS views
        FROM site_analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY path
        ORDER BY views DESC, path ASC
        LIMIT 10
      `),
      client.query(`
        SELECT id, created_at, event_name, path
        FROM site_analytics_events
        ORDER BY created_at DESC
        LIMIT 25
      `),
    ]);

    const row = kpis.rows[0] ?? {};

    return {
      available: true,
      visitorsToday: Number(row.visitors_today) || 0,
      visitors7d: Number(row.visitors_7d) || 0,
      pageViewsToday: Number(row.page_views_today) || 0,
      pageViews7d: Number(row.page_views_7d) || 0,
      loginEvents7d: Number(row.login_events_7d) || 0,
      signupEvents7d: Number(row.signup_events_7d) || 0,
      unlockIntents7d: Number(row.unlock_intents_7d) || 0,
      topPages: topPages.rows.map((r) => ({
        path: String(r.path),
        views: Number(r.views) || 0,
      })),
      recentEvents: recent.rows.map((r) => ({
        id: String(r.id),
        createdAt: new Date(r.created_at).toISOString(),
        eventName: String(r.event_name),
        path: String(r.path),
      })),
    };
  });
}

async function fetchViaSupabase(): Promise<SiteActivitySummary | null> {
  const url = getSupabaseUrl();
  const key = getServiceKey();
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const sinceToday = startOfDay.toISOString();

  const { data: events7d, error } = await client
    .from("site_analytics_events")
    .select("id, created_at, event_name, path, visitor_id")
    .gte("created_at", since7d)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[site-activity] Supabase query failed:", error.message);
    return null;
  }

  const rows = events7d ?? [];
  const visitorsToday = new Set<string>();
  const visitors7d = new Set<string>();
  let pageViewsToday = 0;
  let pageViews7d = 0;
  let loginEvents7d = 0;
  let signupEvents7d = 0;
  let unlockIntents7d = 0;
  const pathCounts = new Map<string, number>();

  for (const row of rows) {
    const createdAt = String(row.created_at);
    const eventName = String(row.event_name);
    const path = String(row.path ?? "/");
    const visitorId = String(row.visitor_id ?? "");
    const isToday = createdAt >= sinceToday;

    if (eventName === "page_view") {
      pageViews7d += 1;
      if (visitorId) visitors7d.add(visitorId);
      pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1);
      if (isToday) {
        pageViewsToday += 1;
        if (visitorId) visitorsToday.add(visitorId);
      }
    } else if (eventName === "login_success") {
      loginEvents7d += 1;
    } else if (eventName === "signup_success") {
      signupEvents7d += 1;
    } else if (eventName === "unlock_intent") {
      unlockIntents7d += 1;
    }
  }

  const topPages = [...pathCounts.entries()]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
    .slice(0, 10);

  const recentEvents = rows.slice(0, 25).map((row) => ({
    id: String(row.id),
    createdAt: new Date(row.created_at as string).toISOString(),
    eventName: String(row.event_name),
    path: String(row.path ?? "/"),
  }));

  return {
    available: true,
    visitorsToday: visitorsToday.size,
    visitors7d: visitors7d.size,
    pageViewsToday,
    pageViews7d,
    loginEvents7d,
    signupEvents7d,
    unlockIntents7d,
    topPages,
    recentEvents,
  };
}

export async function fetchSiteActivitySummary(): Promise<SiteActivitySummary> {
  try {
    const fromPg = await fetchViaPostgres();
    if (fromPg?.available) return fromPg;

    const fromSupabase = await fetchViaSupabase();
    if (fromSupabase?.available) return fromSupabase;
  } catch (error) {
    console.error("[site-activity] Unexpected failure:", error);
  }
  return emptySummary();
}

export function formatEventLabel(eventName: string): string {
  switch (eventName) {
    case "page_view":
      return "Page view";
    case "login_success":
      return "Login";
    case "signup_success":
      return "Sign up";
    case "logout":
      return "Logout";
    case "unlock_intent":
      return "Listing unlock";
    default:
      return eventName;
  }
}

export function formatActivityTime(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "—";
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
