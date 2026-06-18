import type { PropertyListing } from "@/lib/load-category-listings";

export type RecentlyViewedListing = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  priceLabel: string;
  imageUrl: string;
  detailPath: string;
  viewedAt: number;
};

const STORAGE_KEY = "reovana-recently-viewed";
const MAX_ITEMS = 6;

export function getRecentlyViewed(): RecentlyViewedListing[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentlyViewedListing[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(item: Omit<RecentlyViewedListing, "viewedAt">) {
  if (typeof window === "undefined") return;

  const entry: RecentlyViewedListing = { ...item, viewedAt: Date.now() };
  const existing = getRecentlyViewed().filter((row) => row.id !== entry.id);
  const next = [entry, ...existing].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("reovana:recently-viewed"));
  } catch {
    /* private browsing */
  }
}

export function getHomeRecentlyViewedListings(): PropertyListing[] {
  return getRecentlyViewed().map((item) => ({
    id: item.id,
    address: item.address,
    city: item.city,
    state: item.state,
    zip: item.zip,
    price: item.price,
    priceLabel: item.priceLabel,
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    propertyType: "Recently Viewed",
    status: "Viewed",
    tags: ["Recently Viewed"],
    imageUrl: item.imageUrl,
    detailPath: item.detailPath,
    lat: 0,
    lng: 0,
    isNew: false,
  }));
}
