import type { AnalyticsEventName, AnalyticsTrackPayload } from "@/lib/analytics/types";

const VISITOR_KEY = "reovana_vid";
const SESSION_KEY = "reovana_sid";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = randomId();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}

export function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = randomId();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}

export function trackClientEvent(
  eventName: AnalyticsEventName,
  options?: {
    path?: string;
    metadata?: Record<string, unknown>;
    userId?: string | null;
  },
): void {
  if (typeof window === "undefined") return;

  const payload: AnalyticsTrackPayload = {
    eventName,
    path: options?.path ?? `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    sessionId: getOrCreateSessionId(),
    visitorId: getOrCreateVisitorId(),
    userId: options?.userId ?? null,
    metadata: options?.metadata ?? {},
  };

  const body = JSON.stringify({ events: [payload] });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics/track", blob)) return;
    }
  } catch {
    // fall through to fetch
  }

  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
