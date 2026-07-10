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
  sessions7d: number;
  avgPagesPerVisitor7d: number;
  loginEvents7d: number;
  signupEvents7d: number;
  logoutEvents7d: number;
  unlockIntents7d: number;
  topPages: Array<{ path: string; views: number }>;
  trafficBySection: Array<{ section: string; views: number }>;
  dailyTrend: Array<{ date: string; pageViews: number; visitors: number }>;
  topReferrers: Array<{ referrer: string; views: number }>;
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
    sessions7d: 0,
    avgPagesPerVisitor7d: 0,
    loginEvents7d: 0,
    signupEvents7d: 0,
    logoutEvents7d: 0,
    unlockIntents7d: 0,
    topPages: [],
    trafficBySection: [],
    dailyTrend: [],
    topReferrers: [],
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

/** Map a public path into a traffic section for admin reporting. */
export function classifyTrafficSection(path: string): string {
  const clean = (path.split("?")[0] || "/").toLowerCase();
  if (clean === "/" || clean === "") return "Home";
  if (clean.startsWith("/buy")) return "Buy";
  if (clean.startsWith("/auctions") || clean.startsWith("/property")) return "Auctions & listings";
  if (clean.startsWith("/search")) return "Search";
  if (clean.startsWith("/learn")) return "Learn";
  if (clean.startsWith("/sell")) return "Sell";
  if (clean.startsWith("/loans")) return "Loans";
  if (clean.startsWith("/my-profile") || clean.startsWith("/auth")) return "Account";
  return "Other";
}

function roundAvg(views: number, visitors: number): number {
  if (!visitors) return 0;
  return Math.round((views / visitors) * 10) / 10;
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

    const [kpis, topPages, sections, daily, referrers, recent] = await Promise.all([
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
          COUNT(DISTINCT session_id) FILTER (
            WHERE event_name = 'page_view'
              AND created_at >= NOW() - INTERVAL '7 days'
              AND session_id <> ''
          )::int AS sessions_7d,
          COUNT(*) FILTER (
            WHERE event_name = 'login_success'
              AND created_at >= NOW() - INTERVAL '7 days'
          )::int AS login_events_7d,
          COUNT(*) FILTER (
            WHERE event_name = 'signup_success'
              AND created_at >= NOW() - INTERVAL '7 days'
          )::int AS signup_events_7d,
          COUNT(*) FILTER (
            WHERE event_name = 'logout'
              AND created_at >= NOW() - INTERVAL '7 days'
          )::int AS logout_events_7d,
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
        SELECT
          CASE
            WHEN split_part(path, '?', 1) IN ('/', '') THEN 'Home'
            WHEN split_part(path, '?', 1) ILIKE '/buy%' THEN 'Buy'
            WHEN split_part(path, '?', 1) ILIKE '/auctions%'
              OR split_part(path, '?', 1) ILIKE '/property%' THEN 'Auctions & listings'
            WHEN split_part(path, '?', 1) ILIKE '/search%' THEN 'Search'
            WHEN split_part(path, '?', 1) ILIKE '/learn%' THEN 'Learn'
            WHEN split_part(path, '?', 1) ILIKE '/sell%' THEN 'Sell'
            WHEN split_part(path, '?', 1) ILIKE '/loans%' THEN 'Loans'
            WHEN split_part(path, '?', 1) ILIKE '/my-profile%'
              OR split_part(path, '?', 1) ILIKE '/auth%' THEN 'Account'
            ELSE 'Other'
          END AS section,
          COUNT(*)::int AS views
        FROM site_analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY views DESC, section ASC
      `),
      client.query(`
        SELECT
          to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
          COUNT(*) FILTER (WHERE event_name = 'page_view')::int AS page_views,
          COUNT(DISTINCT visitor_id) FILTER (
            WHERE event_name = 'page_view' AND visitor_id <> ''
          )::int AS visitors
        FROM site_analytics_events
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY 1 ASC
      `),
      client.query(`
        SELECT
          CASE
            WHEN referrer IS NULL OR btrim(referrer) = '' THEN '(direct)'
            ELSE left(referrer, 120)
          END AS referrer,
          COUNT(*)::int AS views
        FROM site_analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY views DESC, referrer ASC
        LIMIT 8
      `),
      client.query(`
        SELECT id, created_at, event_name, path
        FROM site_analytics_events
        ORDER BY created_at DESC
        LIMIT 25
      `),
    ]);

    const row = kpis.rows[0] ?? {};
    const visitors7d = Number(row.visitors_7d) || 0;
    const pageViews7d = Number(row.page_views_7d) || 0;

    return {
      available: true,
      visitorsToday: Number(row.visitors_today) || 0,
      visitors7d,
      pageViewsToday: Number(row.page_views_today) || 0,
      pageViews7d,
      sessions7d: Number(row.sessions_7d) || 0,
      avgPagesPerVisitor7d: roundAvg(pageViews7d, visitors7d),
      loginEvents7d: Number(row.login_events_7d) || 0,
      signupEvents7d: Number(row.signup_events_7d) || 0,
      logoutEvents7d: Number(row.logout_events_7d) || 0,
      unlockIntents7d: Number(row.unlock_intents_7d) || 0,
      topPages: topPages.rows.map((r) => ({
        path: String(r.path),
        views: Number(r.views) || 0,
      })),
      trafficBySection: sections.rows.map((r) => ({
        section: String(r.section),
        views: Number(r.views) || 0,
      })),
      dailyTrend: daily.rows.map((r) => ({
        date: String(r.day),
        pageViews: Number(r.page_views) || 0,
        visitors: Number(r.visitors) || 0,
      })),
      topReferrers: referrers.rows.map((r) => ({
        referrer: String(r.referrer),
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
    .select("id, created_at, event_name, path, visitor_id, session_id, referrer")
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
  const sessions7d = new Set<string>();
  let pageViewsToday = 0;
  let pageViews7d = 0;
  let loginEvents7d = 0;
  let signupEvents7d = 0;
  let logoutEvents7d = 0;
  let unlockIntents7d = 0;
  const pathCounts = new Map<string, number>();
  const sectionCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();
  const dailyMap = new Map<string, { pageViews: number; visitors: Set<string> }>();

  for (const row of rows) {
    const createdAt = String(row.created_at);
    const eventName = String(row.event_name);
    const path = String(row.path ?? "/");
    const visitorId = String(row.visitor_id ?? "");
    const sessionId = String(row.session_id ?? "");
    const isToday = createdAt >= sinceToday;
    const day = createdAt.slice(0, 10);

    if (eventName === "page_view") {
      pageViews7d += 1;
      if (visitorId) visitors7d.add(visitorId);
      if (sessionId) sessions7d.add(sessionId);
      pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1);

      const section = classifyTrafficSection(path);
      sectionCounts.set(section, (sectionCounts.get(section) ?? 0) + 1);

      const referrer =
        typeof row.referrer === "string" && row.referrer.trim()
          ? row.referrer.trim().slice(0, 120)
          : "(direct)";
      referrerCounts.set(referrer, (referrerCounts.get(referrer) ?? 0) + 1);

      const dayBucket = dailyMap.get(day) ?? { pageViews: 0, visitors: new Set<string>() };
      dayBucket.pageViews += 1;
      if (visitorId) dayBucket.visitors.add(visitorId);
      dailyMap.set(day, dayBucket);

      if (isToday) {
        pageViewsToday += 1;
        if (visitorId) visitorsToday.add(visitorId);
      }
    } else if (eventName === "login_success") {
      loginEvents7d += 1;
    } else if (eventName === "signup_success") {
      signupEvents7d += 1;
    } else if (eventName === "logout") {
      logoutEvents7d += 1;
    } else if (eventName === "unlock_intent") {
      unlockIntents7d += 1;
    }
  }

  const topPages = [...pathCounts.entries()]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
    .slice(0, 10);

  const trafficBySection = [...sectionCounts.entries()]
    .map(([section, views]) => ({ section, views }))
    .sort((a, b) => b.views - a.views || a.section.localeCompare(b.section));

  const dailyTrend = [...dailyMap.entries()]
    .map(([date, bucket]) => ({
      date,
      pageViews: bucket.pageViews,
      visitors: bucket.visitors.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topReferrers = [...referrerCounts.entries()]
    .map(([referrer, views]) => ({ referrer, views }))
    .sort((a, b) => b.views - a.views || a.referrer.localeCompare(b.referrer))
    .slice(0, 8);

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
    sessions7d: sessions7d.size,
    avgPagesPerVisitor7d: roundAvg(pageViews7d, visitors7d.size),
    loginEvents7d,
    signupEvents7d,
    logoutEvents7d,
    unlockIntents7d,
    topPages,
    trafficBySection,
    dailyTrend,
    topReferrers,
    recentEvents,
  };
}

function mapSummaryRpcPayload(raw: Record<string, unknown>): SiteActivitySummary {
  if (raw.available === false) return emptySummary();

  const visitors7d = Number(raw.visitors7d) || 0;
  const pageViews7d = Number(raw.pageViews7d) || 0;

  return {
    available: true,
    visitorsToday: Number(raw.visitorsToday) || 0,
    visitors7d,
    pageViewsToday: Number(raw.pageViewsToday) || 0,
    pageViews7d,
    sessions7d: Number(raw.sessions7d) || 0,
    avgPagesPerVisitor7d: roundAvg(pageViews7d, visitors7d),
    loginEvents7d: Number(raw.loginEvents7d) || 0,
    signupEvents7d: Number(raw.signupEvents7d) || 0,
    logoutEvents7d: Number(raw.logoutEvents7d) || 0,
    unlockIntents7d: Number(raw.unlockIntents7d) || 0,
    topPages: Array.isArray(raw.topPages)
      ? raw.topPages.map((row) => {
          const item = row as Record<string, unknown>;
          return { path: String(item.path ?? "/"), views: Number(item.views) || 0 };
        })
      : [],
    trafficBySection: Array.isArray(raw.trafficBySection)
      ? raw.trafficBySection.map((row) => {
          const item = row as Record<string, unknown>;
          return { section: String(item.section ?? "Other"), views: Number(item.views) || 0 };
        })
      : [],
    dailyTrend: Array.isArray(raw.dailyTrend)
      ? raw.dailyTrend.map((row) => {
          const item = row as Record<string, unknown>;
          return {
            date: String(item.date ?? ""),
            pageViews: Number(item.pageViews) || 0,
            visitors: Number(item.visitors) || 0,
          };
        })
      : [],
    topReferrers: Array.isArray(raw.topReferrers)
      ? raw.topReferrers.map((row) => {
          const item = row as Record<string, unknown>;
          return { referrer: String(item.referrer ?? "(direct)"), views: Number(item.views) || 0 };
        })
      : [],
    recentEvents: Array.isArray(raw.recentEvents)
      ? raw.recentEvents.map((row) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.id ?? ""),
            createdAt: String(item.createdAt ?? new Date().toISOString()),
            eventName: String(item.eventName ?? ""),
            path: String(item.path ?? "/"),
          };
        })
      : [],
  };
}

async function fetchViaSummaryRpc(): Promise<SiteActivitySummary | null> {
  const url = getSupabaseUrl();
  if (!url) return null;

  // 1) Prefer service role (works without a user session).
  const serviceKey = getServiceKey();
  if (serviceKey) {
    const client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc("get_site_activity_summary");
    if (!error && data && typeof data === "object") {
      return mapSummaryRpcPayload(data as Record<string, unknown>);
    }
    if (error) {
      console.error("[site-activity] Service summary RPC failed:", error.message);
    }
  }

  // 2) Fall back to the signed-in admin session (allowlisted in the RPC).
  try {
    const { createSupabaseAuthServerClient } = await import("@/lib/supabase/auth-server");
    const sessionClient = await createSupabaseAuthServerClient();
    const { data, error } = await sessionClient.rpc("get_site_activity_summary");
    if (error) {
      console.error("[site-activity] Session summary RPC failed:", error.message);
      return null;
    }
    if (!data || typeof data !== "object") return null;
    return mapSummaryRpcPayload(data as Record<string, unknown>);
  } catch (error) {
    console.error("[site-activity] Session summary RPC unavailable:", error);
    return null;
  }
}

export async function fetchSiteActivitySummary(): Promise<SiteActivitySummary> {
  try {
    const fromPg = await fetchViaPostgres();
    if (fromPg?.available) return fromPg;

    const fromSupabase = await fetchViaSupabase();
    if (fromSupabase?.available) return fromSupabase;

    const fromRpc = await fetchViaSummaryRpc();
    if (fromRpc?.available) return fromRpc;
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

export function formatTrendDay(date: string): string {
  const ts = Date.parse(`${date}T12:00:00Z`);
  if (Number.isNaN(ts)) return date;
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(
    new Date(ts),
  );
}
