import type { PropertyCategoryKey } from "@/lib/property-categories";
import { loadGsaRealEstateSales } from "@/lib/gsa-realestatesales";
import { loadHomeStepsListings } from "@/lib/homesteps-listings";
import { loadHudListings, type HudListing } from "@/lib/hud-listings";
import { hudDetailPath } from "@/lib/property-categories";
import { loadVrmListings } from "@/lib/vrm-listings";

export type PropertyListing = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  priceLabel: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  propertyType: string;
  status: string;
  tags: string[];
  imageUrl: string;
  detailPath: string;
  lat: number;
  lng: number;
  isNew: boolean;
  subtitle?: string;
};

function hudToListing(h: HudListing): PropertyListing {
  return {
    id: h.id,
    address: h.address,
    city: h.city,
    state: h.state,
    zip: h.zip,
    price: h.listPrice,
    priceLabel: "List Price",
    bedrooms: h.bedrooms,
    bathrooms: h.bathrooms,
    squareFootage: h.squareFootage,
    propertyType: h.propertyType,
    status: h.propertyStatus || "Active",
    tags: [h.propertyType, h.listingPeriod].filter(Boolean),
    imageUrl: h.displayImageUrl,
    detailPath: hudDetailPath(h.caseNumber),
    lat: h.lat,
    lng: h.lng,
    isNew: false,
    subtitle: `Case #${h.caseNumber}`,
  };
}

function homestepsToListing(
  l: ReturnType<typeof loadHomeStepsListings>["listings"][number],
): PropertyListing {
  return {
    id: l.id,
    address: l.address,
    city: l.city,
    state: l.state,
    zip: l.zip,
    price: l.listPrice,
    priceLabel: "List Price",
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    propertyType: "Bank Owned",
    status: "For Sale",
    tags: ["Freddie Mac", "REO"],
    imageUrl: l.displayImageUrl,
    detailPath: "/property/detail/v1",
    lat: l.lat,
    lng: l.lng,
    isNew: false,
  };
}

function vrmToListing(l: ReturnType<typeof loadVrmListings>["listings"][number]): PropertyListing {
  return {
    id: l.id,
    address: l.address,
    city: l.city,
    state: l.state,
    zip: l.zip,
    price: l.listPrice,
    priceLabel: "List Price",
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    squareFootage: l.squareFootage,
    propertyType: "VA REO",
    status: l.status,
    tags: l.isVendeeFinancing ? ["VA REO", "Vendee Financing"] : ["VA REO"],
    imageUrl: l.displayImageUrl,
    detailPath: "/property/detail/v1",
    lat: l.lat,
    lng: l.lng,
    isNew: l.isNew,
  };
}

function gsaSaleToListing(
  l: ReturnType<typeof loadGsaRealEstateSales>["listings"][number],
): PropertyListing {
  return {
    id: l.id,
    address: l.address,
    city: l.city,
    state: l.state,
    zip: l.zip,
    price: l.startingBid,
    priceLabel: "Starting Bid",
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    propertyType: l.propertyType,
    status: l.status,
    tags: [l.auctionType, "Federal Auction"],
    imageUrl: l.displayImageUrl,
    detailPath: "/property/detail/v1",
    lat: l.lat,
    lng: l.lng,
    isNew: false,
    subtitle: l.title,
  };
}

/** JSON fallback when Supabase is unavailable. */
export function loadCategoryListings(categoryKey: PropertyCategoryKey): PropertyListing[] {
  switch (categoryKey) {
    case "hud-home":
      return loadHudListings().listings.map(hudToListing);

    case "bank-owned": {
      const vrm = loadVrmListings().listings.map(vrmToListing);
      const homesteps = loadHomeStepsListings().listings.map(homestepsToListing);
      return [...vrm, ...homesteps].sort((a, b) => b.price - a.price);
    }

    case "auction-property": {
      return loadGsaRealEstateSales().listings.map(gsaSaleToListing);
    }

    case "motivated-seller":
    case "off-market":
    case "foreclosure":
    case "pre-foreclosure":
    case "sheriffs-sale":
    case "tax-delinquent":
      return [];

    default:
      return [];
  }
}
