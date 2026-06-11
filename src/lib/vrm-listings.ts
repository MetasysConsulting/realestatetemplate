import vrmData from "@/data/vrm-listings.json";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";

export type VrmListing = {
  id: string;
  propertyId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  listPrice: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  lotSize: number;
  status: string;
  isNew: boolean;
  isVendeeFinancing: boolean;
  imageUrl: string | null;
  displayImageUrl: string;
  detailUrl: string;
  sourceUrl: string;
  sourceAgency: string;
  lat: number;
  lng: number;
};

export type VrmListingsDataset = {
  scrapedAt: string;
  sourceUrl: string;
  count: number;
  listings: VrmListing[];
};

const US_STATE_COORDS: Record<string, [number, number]> = {
  TX: [31.054487, -97.563461],
  FL: [27.766279, -81.686783],
  CA: [36.116203, -119.681564],
  GA: [33.040619, -83.643074],
  AZ: [33.729759, -111.431221],
  OH: [40.388783, -82.764915],
  IL: [40.349457, -88.986137],
  PA: [40.590752, -77.209755],
  NY: [42.165726, -74.948051],
  MI: [43.326618, -84.536095],
  NC: [35.630066, -79.806419],
  VA: [37.769337, -78.169968],
  CO: [39.059811, -105.311104],
  TN: [35.747845, -86.692345],
};

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function coordsForListing(id: string, state: string): [number, number] {
  const base = US_STATE_COORDS[state] ?? [39.8283, -98.5795];
  const spread = hashString(id) % 40;
  const angle = (spread / 40) * Math.PI * 2;
  const radius = 0.12 + (spread % 8) * 0.03;
  return [base[0] + Math.sin(angle) * radius, base[1] + Math.cos(angle) * radius];
}

function enrichListing(raw: (typeof vrmData.listings)[number]): VrmListing {
  const [lat, lng] = coordsForListing(raw.id, raw.state);
  return {
    ...raw,
    displayImageUrl: raw.imageUrl ?? DEFAULT_AUCTION_PROPERTY_IMAGE,
    lat,
    lng,
  };
}

export function loadVrmListings(): VrmListingsDataset {
  const listings = vrmData.listings.map(enrichListing);
  return {
    scrapedAt: vrmData.scrapedAt,
    sourceUrl: vrmData.sourceUrl,
    count: vrmData.count,
    listings,
  };
}

export function getVrmFilterOptions(listings: VrmListing[]) {
  const states = [...new Set(listings.map((l) => l.state))].sort();
  const statuses = [...new Set(listings.map((l) => l.status).filter(Boolean))].sort();
  return { states, statuses };
}

export function formatVrmPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatVrmScrapedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
