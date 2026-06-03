export const PROPERTY_DETAIL_PREFIX = "/property/detail/";

export function isPropertyDetailRoute(route: string): boolean {
  return route.startsWith(PROPERTY_DETAIL_PREFIX);
}

export const UNLOCK_STORAGE_KEY = "proty-property-unlocked";
