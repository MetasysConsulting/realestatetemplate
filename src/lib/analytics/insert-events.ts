import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { getDatabaseUrl } from "@/lib/supabase/listings-query";
import { getSupabaseUrl } from "@/lib/supabase/env";
import type { AnalyticsEventName } from "@/lib/analytics/types";
import { normalizeAnalyticsPath } from "@/lib/analytics/types";

const { Client } = pg;

export type AnalyticsEventInsert = {
  eventName: AnalyticsEventName;
  path: string;
  referrer: string | null;
  sessionId: string;
  visitorId: string;
  userId: string | null;
  metadata: Record<string, unknown>;
  userAgent: string | null;
};

function getServiceKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY
  );
}

async function insertViaPostgres(events: AnalyticsEventInsert[]): Promise<boolean> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl || events.length === 0) return false;

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8_000,
  });

  try {
    await client.connect();
    const values: unknown[] = [];
    const rowsSql: string[] = [];

    events.forEach((event, index) => {
      const base = index * 8;
      rowsSql.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}::jsonb, $${base + 8})`,
      );
      values.push(
        event.eventName,
        normalizeAnalyticsPath(event.path),
        event.referrer,
        event.sessionId.slice(0, 128),
        event.visitorId.slice(0, 128),
        event.userId,
        JSON.stringify(event.metadata ?? {}),
        event.userAgent?.slice(0, 500) ?? null,
      );
    });

    await client.query(
      `INSERT INTO site_analytics_events
        (event_name, path, referrer, session_id, visitor_id, user_id, metadata, user_agent)
       VALUES ${rowsSql.join(", ")}`,
      values,
    );
    return true;
  } catch (error) {
    console.error("[analytics] Postgres insert failed:", error);
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function insertViaSupabase(events: AnalyticsEventInsert[]): Promise<boolean> {
  const url = getSupabaseUrl();
  const key = getServiceKey();
  if (!url || !key || events.length === 0) return false;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows = events.map((event) => ({
    event_name: event.eventName,
    path: normalizeAnalyticsPath(event.path),
    referrer: event.referrer,
    session_id: event.sessionId.slice(0, 128),
    visitor_id: event.visitorId.slice(0, 128),
    user_id: event.userId,
    metadata: event.metadata ?? {},
    user_agent: event.userAgent?.slice(0, 500) ?? null,
  }));

  const { error } = await client.from("site_analytics_events").insert(rows);
  if (error) {
    console.error("[analytics] Supabase insert failed:", error.message);
    return false;
  }
  return true;
}

export async function insertAnalyticsEvents(events: AnalyticsEventInsert[]): Promise<boolean> {
  if (!events.length) return true;
  if (await insertViaPostgres(events)) return true;
  return insertViaSupabase(events);
}
