export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "login_success",
  "signup_success",
  "logout",
  "unlock_intent",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type AnalyticsTrackPayload = {
  eventName: AnalyticsEventName;
  path?: string;
  referrer?: string | null;
  sessionId?: string;
  visitorId?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return (
    typeof value === "string" &&
    (ANALYTICS_EVENT_NAMES as readonly string[]).includes(value)
  );
}

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|wget|curl|python-requests|scrapy/i;

export function isLikelyBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_UA.test(userAgent);
}

export function normalizeAnalyticsPath(path: unknown): string {
  if (typeof path !== "string" || !path.trim()) return "/";
  const trimmed = path.trim().slice(0, 500);
  if (!trimmed.startsWith("/")) return `/${trimmed}`;
  return trimmed;
}
