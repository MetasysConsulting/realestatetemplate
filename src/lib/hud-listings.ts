import hudData from "@/data/hud-listings.json";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";

export type HudListing = {
  id: string;
  caseNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  listPrice: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  yearBuilt: string;
  propertyType: string;
  listingPeriod: string;
  propertyStatus: string;
  listDate: string;
  bidOpenDate: string;
  periodDeadlineDate: string;
  fhaFinancing: string;
  eligibleBidders: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  displayImageUrl: string;
  detailUrl: string;
  sourceUrl: string;
  sourceAgency: string;
};

export type HudListingsDataset = {
  scrapedAt: string;
  sourceUrl: string;
  count: number;
  listings: HudListing[];
};

function enrichListing(raw: (typeof hudData.listings)[number]): HudListing {
  return {
    ...raw,
    displayImageUrl: raw.imageUrl ?? DEFAULT_AUCTION_PROPERTY_IMAGE,
  };
}

export function loadHudListings(): HudListingsDataset {
  const listings = hudData.listings.map(enrichListing);

  return {
    scrapedAt: hudData.scrapedAt,
    sourceUrl: hudData.sourceUrl,
    count: hudData.count,
    listings,
  };
}

export function getHudFilterOptions(listings: HudListing[]) {
  const states = [...new Set(listings.map((l) => l.state))].sort();
  const propertyTypes = [...new Set(listings.map((l) => l.propertyType).filter(Boolean))].sort();
  const listingPeriods = [...new Set(listings.map((l) => l.listingPeriod).filter(Boolean))].sort();

  return { states, propertyTypes, listingPeriods };
}

export function formatHudPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatHudScrapedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
