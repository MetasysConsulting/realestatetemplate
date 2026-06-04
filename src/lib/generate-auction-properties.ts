import type { BuyCategoryKey } from "@/lib/buy-categories";
import { getAuctionPropertyImageUrl } from "@/lib/auction-property-images";

export type AuctionProperty = {
  id: string;
  isNew: boolean;
  openingBid: number;
  tags: string[];
  category: string;
  buyType: BuyCategoryKey;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  auctionDate: string;
  auctionTime: string;
  status: string;
  lat: number;
  lng: number;
  imageUrl: string;
};

const STREETS = [
  "Oak Meadow Ln",
  "Edgewood St",
  "Palm Harbor Blvd",
  "Willow Creek Dr",
  "Lakeview Terrace",
  "Birchwood Ave",
  "Pinecrest Rd",
  "Harbor View Ct",
  "Desert Sage Way",
  "Maple Ridge Dr",
  "Cedar Park Ave",
  "Magnolia Way",
  "Summit Hill Rd",
  "Riverbend Ct",
  "Highland Park Blvd",
];

const CITIES: { city: string; state: string; lat: number; lng: number }[] = [
  { city: "Bonita Springs", state: "FL", lat: 26.34, lng: -81.78 },
  { city: "Tampa", state: "FL", lat: 27.95, lng: -82.66 },
  { city: "Austin", state: "TX", lat: 30.22, lng: -97.79 },
  { city: "Houston", state: "TX", lat: 29.79, lng: -95.65 },
  { city: "Phoenix", state: "AZ", lat: 33.45, lng: -112.07 },
  { city: "Cleveland", state: "OH", lat: 41.48, lng: -81.69 },
  { city: "Denver", state: "CO", lat: 39.69, lng: -105.03 },
  { city: "Atlanta", state: "GA", lat: 33.72, lng: -84.49 },
  { city: "Jacksonville", state: "FL", lat: 30.29, lng: -81.62 },
  { city: "Las Vegas", state: "NV", lat: 36.03, lng: -115.12 },
  { city: "Charlotte", state: "NC", lat: 35.22, lng: -80.84 },
  { city: "Nashville", state: "TN", lat: 36.16, lng: -86.78 },
  { city: "Columbus", state: "OH", lat: 39.96, lng: -82.99 },
  { city: "Indianapolis", state: "IN", lat: 39.77, lng: -86.16 },
  { city: "Kansas City", state: "MO", lat: 39.1, lng: -94.58 },
];

const CATEGORY_META: Record<
  Exclude<BuyCategoryKey, "all">,
  { label: string; tags: string[]; commercial?: boolean }
> = {
  "foreclosure-homes": {
    label: "Foreclosure Homes",
    tags: ["Cash Only", "No Buyers Premium"],
  },
  "bank-owned": { label: "Bank Owned", tags: ["Bank Owned"] },
  "second-chance-foreclosure": {
    label: "2nd Chance Foreclosure",
    tags: ["2nd Chance", "Cash Only"],
  },
  "short-sale": { label: "Short Sale", tags: ["Short Sale"] },
  commercial: { label: "Commercial", tags: ["Commercial"], commercial: true },
  "non-bank-owned": { label: "Non-Bank Owned", tags: ["Non-Bank Owned"] },
};

const AUCTION_MODES = ["In Person Auction", "Online Auction", "Sealed Bid", "Live Event"];
const TIMEZONES = ["ET", "CT", "MT", "PT"];
const MONTHS = ["Jun", "Jul", "Aug", "Sep"];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export { formatCurrency };

export function getInventoryCount(categoryKey: BuyCategoryKey, listed: number): number {
  const base = 1800 + (hashString(categoryKey) % 6200);
  return base + listed;
}

export function generateAuctionProperties(
  categoryKey: BuyCategoryKey,
  count = 32,
): AuctionProperty[] {
  const rng = mulberry32(hashString(`reovana-${categoryKey}`));
  const types: BuyCategoryKey[] =
    categoryKey === "all"
      ? (Object.keys(CATEGORY_META) as Exclude<BuyCategoryKey, "all">[])
      : [categoryKey];

  const properties: AuctionProperty[] = [];

  for (let i = 0; i < count; i++) {
    const buyType = categoryKey === "all" ? pick(rng, types) : categoryKey;
    const meta = CATEGORY_META[buyType as Exclude<BuyCategoryKey, "all">];
    const location = pick(rng, CITIES);
    const streetNum = 100 + Math.floor(rng() * 9800);
    const street = pick(rng, STREETS);
    const beds = meta.commercial ? 0 : 2 + Math.floor(rng() * 4);
    const baths = meta.commercial ? 1 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 3);
    const sqft = meta.commercial
      ? 2200 + Math.floor(rng() * 8000)
      : 900 + Math.floor(rng() * 2200);
    const openingBid =
      (meta.commercial ? 180000 : 75000) + Math.floor(rng() * (meta.commercial ? 600000 : 380000));
    const mode = pick(rng, AUCTION_MODES);
    const isLive = rng() > 0.35;
    const id = `${buyType}-${i + 1}-${hashString(`${categoryKey}-${i}`).toString(36).slice(0, 6)}`;

    const lat = location.lat + (rng() - 0.5) * 2.2;
    const lng = location.lng + (rng() - 0.5) * 2.2;
    const day = 8 + Math.floor(rng() * 20);
    const tz = pick(rng, TIMEZONES);
    const hour = 9 + Math.floor(rng() * 6);

    properties.push({
      id,
      isNew: rng() > 0.55,
      openingBid,
      tags: [...meta.tags],
      buyType,
      category: `${meta.label} — ${mode}`,
      address: `${streetNum} ${street}`,
      city: location.city,
      state: location.state,
      zip: String(10000 + Math.floor(rng() * 89999)),
      beds,
      baths,
      sqft,
      auctionDate: `${pick(rng, MONTHS)} ${day}, 2026`,
      auctionTime: `${hour}:00 ${hour >= 12 ? "PM" : "AM"} ${tz}`,
      status: isLive ? "Auction Event: Live Event" : "Auction Event: Upcoming",
      lat,
      lng,
      imageUrl: getAuctionPropertyImageUrl(id, buyType),
    });
  }

  return properties;
}
