import { generateAuctionProperties } from "@/lib/generate-auction-properties";
import type { PropertyListing } from "@/lib/load-category-listings";
import { PROPERTY_CATEGORIES } from "@/lib/property-categories";
import type { BuyCategoryKey } from "@/lib/buy-categories";

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

const DEMO_BUY_TYPE_PATHS: Partial<Record<BuyCategoryKey, string>> = {
  "foreclosure-homes": PROPERTY_CATEGORIES.foreclosure.path,
  "bank-owned": PROPERTY_CATEGORIES["bank-owned"].path,
  "second-chance-foreclosure": PROPERTY_CATEGORIES["pre-foreclosure"].path,
  "short-sale": PROPERTY_CATEGORIES.foreclosure.path,
  commercial: PROPERTY_CATEGORIES["auction-property"].path,
  "non-bank-owned": PROPERTY_CATEGORIES["motivated-seller"].path,
};

/** Placeholder row for homepage demo — not tied to real view history yet. */
export function getRecentlyViewedDemoListings(): PropertyListing[] {
  return generateAuctionProperties("all", 6).map((mock) => ({
    id: mock.id,
    address: mock.address,
    city: mock.city,
    state: mock.state,
    zip: mock.zip,
    price: mock.openingBid,
    priceLabel: "Est. Opening Bid",
    bedrooms: mock.beds,
    bathrooms: mock.baths,
    squareFootage: mock.sqft,
    propertyType: "Recently Viewed",
    status: mock.status,
    tags: mock.tags,
    imageUrl: mock.imageUrl,
    detailPath: DEMO_BUY_TYPE_PATHS[mock.buyType] ?? PROPERTY_CATEGORIES.foreclosure.path,
    lat: mock.lat,
    lng: mock.lng,
    isNew: mock.isNew,
  }));
}
