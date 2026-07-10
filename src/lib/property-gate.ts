export const PROPERTY_DETAIL_PREFIX = "/property/detail/";

export function isPropertyDetailRoute(route: string): boolean {
  return route.startsWith(PROPERTY_DETAIL_PREFIX);
}

/** Extract `listings.id` from `/property/detail/{id}` paths. */
export function listingIdFromPropertyDetailPath(pathname: string): string | undefined {
  if (!pathname.startsWith(PROPERTY_DETAIL_PREFIX)) return undefined;
  const rest = pathname.slice(PROPERTY_DETAIL_PREFIX.length).replace(/\/+$/, "");
  if (!rest || rest.includes("/")) return undefined;
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}

/** Legacy global key — no longer written; kept so old sessions can be ignored per listing */
export const UNLOCK_STORAGE_KEY = "proty-property-unlocked";

/** Valid unlock markers. Legacy `"1"` (fake free unlock) is ignored. */
export type ListingUnlockReason = "paid" | "admin";

export function listingUnlockStorageKey(scope: string): string {
  return `${UNLOCK_STORAGE_KEY}:${scope}`;
}

function isValidUnlockMarker(value: string | null): value is ListingUnlockReason {
  return value === "paid" || value === "admin";
}

export function readListingUnlocked(scope: string): boolean {
  if (typeof window === "undefined") return false;
  return isValidUnlockMarker(sessionStorage.getItem(listingUnlockStorageKey(scope)));
}

export function writeListingUnlocked(scope: string, reason: ListingUnlockReason): void {
  sessionStorage.setItem(listingUnlockStorageKey(scope), reason);
  trackUnlockIntent(scope, reason);
}

export function trackUnlockIntent(
  scope: string,
  reason: ListingUnlockReason | "checkout_soon" = "checkout_soon",
): void {
  try {
    void import("@/lib/analytics/client-track").then(({ trackClientEvent }) => {
      trackClientEvent("unlock_intent", {
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
        metadata: { listingScope: scope, reason },
      });
    });
  } catch {
    // Never block unlock UX on analytics
  }
}

export async function fetchPaywallBypass(): Promise<boolean> {
  const access = await fetchPaywallAccess();
  return access.bypass;
}

export async function fetchPaywallAccess(listingId?: string): Promise<{
  bypass: boolean;
  unlocked: boolean;
  hasUnlock: boolean;
}> {
  try {
    const url = listingId
      ? `/api/paywall/bypass?listingId=${encodeURIComponent(listingId)}`
      : "/api/paywall/bypass";
    const res = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) {
      return { bypass: false, unlocked: false, hasUnlock: false };
    }
    const data = (await res.json()) as {
      bypass?: boolean;
      unlocked?: boolean;
      hasUnlock?: boolean;
    };
    return {
      bypass: Boolean(data.bypass),
      unlocked: Boolean(data.unlocked ?? data.bypass),
      hasUnlock: Boolean(data.hasUnlock),
    };
  } catch {
    return { bypass: false, unlocked: false, hasUnlock: false };
  }
}

export const LOCKED_BLUR_FILTER = "blur(14px)";

/** Property photos stay visible; only text/detail blocks are blurred. */
export const BLUR_EXEMPT_SELECTORS = [
  ".section-property-image",
  ".reovana-listing-gallery",
] as const;

export function isBlurExemptElement(el: HTMLElement): boolean {
  return BLUR_EXEMPT_SELECTORS.some(
    (selector) => el.matches(selector) || Boolean(el.closest(selector)),
  );
}

export function applyLockedBlur(el: HTMLElement): void {
  if (isBlurExemptElement(el)) return;
  el.classList.add("proty-blurred");
  el.style.filter = LOCKED_BLUR_FILTER;
  el.style.setProperty("-webkit-filter", LOCKED_BLUR_FILTER);
  el.style.opacity = "0.55";
  el.style.pointerEvents = "none";
  el.style.userSelect = "none";
}

export function clearLockedBlur(el: HTMLElement): void {
  el.classList.remove("proty-blurred");
  el.style.filter = "";
  el.style.removeProperty("-webkit-filter");
  el.style.opacity = "";
  el.style.pointerEvents = "";
  el.style.userSelect = "";
}

export function syncBlurTargets(root: HTMLElement, locked: boolean): void {
  clearGalleryBlur(root);

  root.querySelectorAll<HTMLElement>(".reovana-blur-target, .proty-blurred").forEach((el) => {
    if (isBlurExemptElement(el)) {
      clearLockedBlur(el);
      return;
    }

    if (locked) applyLockedBlur(el);
    else clearLockedBlur(el);
  });
}

export function clearGalleryBlur(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(BLUR_EXEMPT_SELECTORS.join(", ")).forEach((el) => {
    clearLockedBlur(el);
  });
}
