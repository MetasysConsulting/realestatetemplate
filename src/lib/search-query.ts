import {
  normalizeStateQuery,
  parseLocationQuery,
  stateNameForAbbr,
} from "@/lib/us-states";
import type { PropertyListing } from "@/lib/load-category-listings";

export type SearchNavInput = {
  q?: string;
  state?: string;
  propertyType?: string;
  beds?: string | number;
  baths?: string | number;
  minPrice?: string | number;
  maxPrice?: string | number;
  pageSize?: string | number;
};

function token(value: string | number | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

/**
 * Build a clean /search URL: promote bare state names, peel city/state/ZIP,
 * and keep other refinement filters.
 */
export function buildNormalizedSearchHref(input: SearchNavInput): string {
  const rawQ = token(input.q);
  const explicitState = normalizeStateQuery(token(input.state));
  const parsed = parseLocationQuery(rawQ);

  // Location text wins when it encodes a state ("california", "Miami, FL").
  // Otherwise keep an explicit state filter (e.g. toolbar city + prior state).
  const state = parsed.state || explicitState;
  let q = parsed.q;
  if (!q && parsed.zip) q = parsed.zip;
  else if (q && parsed.zip && !q.includes(parsed.zip)) q = `${q} ${parsed.zip}`;

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (state) params.set("state", state);

  const propertyType = token(input.propertyType);
  if (propertyType) params.set("propertyType", propertyType);

  for (const key of ["beds", "baths", "minPrice", "maxPrice"] as const) {
    const value = token(input[key]);
    if (value && value !== "0") params.set(key, value);
  }

  const pageSize = token(input.pageSize);
  if (pageSize && pageSize !== "40") params.set("pageSize", pageSize);

  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function searchResultsHeading(q: string, state: string): string {
  const parsed = parseLocationQuery(q);
  const effectiveState = parsed.state || normalizeStateQuery(state);
  const effectiveQ = parsed.q || (!parsed.state && parsed.zip ? parsed.zip : "");

  if (effectiveQ && effectiveState) {
    return `Search: ${effectiveQ}, ${effectiveState}`;
  }
  if (effectiveQ) return `Search: ${effectiveQ}`;
  if (effectiveState) return `Search: ${stateNameForAbbr(effectiveState)}`;
  return "Search Results";
}

/** Prefer exact city / ZIP hits and push $0 prices to the bottom of a page. */
export function rankSearchListings(
  listings: PropertyListing[],
  rawQ: string,
): PropertyListing[] {
  const parsed = parseLocationQuery(rawQ);
  const needle = (parsed.q || parsed.zip || "").trim().toLowerCase();
  if (!needle && listings.every((l) => l.price > 0)) return listings;

  const score = (listing: PropertyListing): number => {
    let s = 0;
    if (listing.price > 0) s += 1_000_000;
    if (listing.hasImage) s += 5_000;
    if (listing.hasRealCoordinates) s += 1_000;

    if (needle) {
      const city = listing.city.trim().toLowerCase();
      const zip = listing.zip.trim();
      const address = listing.address.trim().toLowerCase();

      if (parsed.zip && zip.startsWith(parsed.zip)) s += 80_000;
      if (city === needle) s += 70_000;
      else if (city.startsWith(needle)) s += 50_000;
      else if (city.includes(needle)) s += 30_000;
      if (address.startsWith(needle)) s += 25_000;
      else if (address.includes(needle)) s += 12_000;
    }

    s += Math.min(Math.max(listing.price, 0), 50_000_000) / 10_000;
    return s;
  };

  return [...listings].sort((a, b) => score(b) - score(a));
}
