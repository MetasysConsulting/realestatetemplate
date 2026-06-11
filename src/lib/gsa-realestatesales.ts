import gsaSalesData from "@/data/gsa-realestatesales.json";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";

export type GsaRealEstateSale = {
  id: string;
  propertyId: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  startingBid: number;
  status: string;
  auctionType: string;
  propertyType: string;
  imageUrl: string | null;
  displayImageUrl: string;
  detailUrl: string;
  sourceUrl: string;
  sourceAgency: string;
  lat: number;
  lng: number;
};

export type GsaRealEstateSalesDataset = {
  scrapedAt: string;
  sourceUrl: string;
  count: number;
  listings: GsaRealEstateSale[];
};

const US_STATE_COORDS: Record<string, [number, number]> = {
  TX: [31.054487, -97.563461],
  FL: [27.766279, -81.686783],
  CA: [36.116203, -119.681564],
  VA: [37.769337, -78.169968],
  DC: [38.907192, -77.036871],
};

function coordsForState(state: string, index: number): [number, number] {
  const base = US_STATE_COORDS[state] ?? [39.8283, -98.5795];
  const spread = (index % 12) * 0.08;
  return [base[0] + spread * 0.3, base[1] + spread * 0.4];
}

function enrichListing(
  raw: (typeof gsaSalesData.listings)[number],
  index: number,
): GsaRealEstateSale {
  const [lat, lng] = coordsForState(raw.state, index);
  return {
    ...raw,
    displayImageUrl: raw.imageUrl ?? DEFAULT_AUCTION_PROPERTY_IMAGE,
    lat,
    lng,
  };
}

export function loadGsaRealEstateSales(): GsaRealEstateSalesDataset {
  const listings = gsaSalesData.listings.map(enrichListing);
  return {
    scrapedAt: gsaSalesData.scrapedAt,
    sourceUrl: gsaSalesData.sourceUrl,
    count: gsaSalesData.count,
    listings,
  };
}

export function getGsaSalesFilterOptions(listings: GsaRealEstateSale[]) {
  const states = [...new Set(listings.map((l) => l.state))].sort();
  const propertyTypes = [...new Set(listings.map((l) => l.propertyType).filter(Boolean))].sort();
  const statuses = [...new Set(listings.map((l) => l.status).filter(Boolean))].sort();
  return { states, propertyTypes, statuses };
}

export function formatGsaSalePrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatGsaSalesScrapedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
