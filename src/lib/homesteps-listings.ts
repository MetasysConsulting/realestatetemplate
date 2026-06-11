import homestepsData from "@/data/homesteps-listings.json";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";

export type HomeStepsListing = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  listPrice: number;
  lat: number;
  lng: number;
  imageUrl: string | null;
  displayImageUrl: string;
  detailUrl: string;
  sourceUrl: string;
  sourceAgency: string;
  searchState: string;
};

export type HomeStepsDataset = {
  scrapedAt: string;
  sourceUrl: string;
  count: number;
  listings: HomeStepsListing[];
};

function enrichListing(raw: (typeof homestepsData.listings)[number]): HomeStepsListing {
  return {
    ...raw,
    displayImageUrl: raw.imageUrl ?? DEFAULT_AUCTION_PROPERTY_IMAGE,
  };
}

export function loadHomeStepsListings(): HomeStepsDataset {
  const listings = homestepsData.listings.map(enrichListing);
  return {
    scrapedAt: homestepsData.scrapedAt,
    sourceUrl: homestepsData.sourceUrl,
    count: homestepsData.count,
    listings,
  };
}

export function getHomeStepsFilterOptions(listings: HomeStepsListing[]) {
  const states = [...new Set(listings.map((l) => l.state))].sort();
  return { states };
}

export function formatHomeStepsPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatHomeStepsScrapedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
