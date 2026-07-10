import { NextResponse, type NextRequest } from "next/server";
import { insertAnalyticsEvents } from "@/lib/analytics/insert-events";
import {
  isAnalyticsEventName,
  isLikelyBotUserAgent,
  normalizeAnalyticsPath,
  type AnalyticsTrackPayload,
} from "@/lib/analytics/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BATCH = 20;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX;
}

function parsePayload(raw: unknown): AnalyticsTrackPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!isAnalyticsEventName(obj.eventName)) return null;

  const userId =
    typeof obj.userId === "string" && obj.userId.length > 0 && obj.userId.length <= 64
      ? obj.userId
      : null;

  const metadata =
    obj.metadata && typeof obj.metadata === "object" && !Array.isArray(obj.metadata)
      ? (obj.metadata as Record<string, unknown>)
      : {};

  return {
    eventName: obj.eventName,
    path: normalizeAnalyticsPath(obj.path),
    referrer: typeof obj.referrer === "string" ? obj.referrer.slice(0, 500) : null,
    sessionId: typeof obj.sessionId === "string" ? obj.sessionId.slice(0, 128) : "",
    visitorId: typeof obj.visitorId === "string" ? obj.visitorId.slice(0, 128) : "",
    userId,
    metadata,
  };
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent");
  if (isLikelyBotUserAgent(userAgent)) {
    return new NextResponse(null, { status: 204 });
  }

  const key = clientKey(request);
  if (isRateLimited(key)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawEvents = Array.isArray((body as { events?: unknown })?.events)
    ? ((body as { events: unknown[] }).events)
    : [body];

  const parsed = rawEvents
    .slice(0, MAX_BATCH)
    .map(parsePayload)
    .filter((event): event is AnalyticsTrackPayload => Boolean(event));

  if (!parsed.length) {
    return NextResponse.json({ error: "No valid events" }, { status: 400 });
  }

  const ok = await insertAnalyticsEvents(
    parsed.map((event) => ({
      eventName: event.eventName,
      path: event.path ?? "/",
      referrer: event.referrer ?? null,
      sessionId: event.sessionId ?? "",
      visitorId: event.visitorId ?? "",
      userId: event.userId ?? null,
      metadata: event.metadata ?? {},
      userAgent,
    })),
  );

  if (!ok) {
    return NextResponse.json({ error: "Failed to store events" }, { status: 503 });
  }

  return new NextResponse(null, { status: 204 });
}
