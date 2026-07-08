export const PROPERTY_DETAIL_PREFIX = "/property/detail/";

export function isPropertyDetailRoute(route: string): boolean {
  return route.startsWith(PROPERTY_DETAIL_PREFIX);
}

/** Legacy global key — no longer written; kept so old sessions can be ignored per listing */
export const UNLOCK_STORAGE_KEY = "proty-property-unlocked";

export function listingUnlockStorageKey(scope: string): string {
  return `${UNLOCK_STORAGE_KEY}:${scope}`;
}

export function readListingUnlocked(scope: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(listingUnlockStorageKey(scope)) === "1";
}

export function writeListingUnlocked(scope: string): void {
  sessionStorage.setItem(listingUnlockStorageKey(scope), "1");
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
