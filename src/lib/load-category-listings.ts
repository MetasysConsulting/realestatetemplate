import type { BuyCategoryKey } from "@/lib/buy-categories";
import { generateAuctionProperties } from "@/lib/generate-auction-properties";
import { loadGsaRealEstateSales } from "@/lib/gsa-realestatesales";
import { loadHomeStepsListings } from "@/lib/homesteps-listings";
import { loadHudListings, type HudListing } from "@/lib/hud-listings";
import type { PropertyCategoryKey } from "@/lib/property-categories";
import { hudDetailPath, PROPERTY_CATEGORIES } from "@/lib/property-categories";
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

function mockToListing(
  mock: ReturnType<typeof generateAuctionProperties>[number],
  categoryLabel: string,
): PropertyListing {
  return {
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
    propertyType: categoryLabel,
    status: mock.status,
    tags: mock.tags,
    imageUrl: mock.imageUrl,
    detailPath: "/property/detail/v1",
    lat: mock.lat,
    lng: mock.lng,
    isNew: mock.isNew,
  };
}

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

function loadMock(categoryKey: PropertyCategoryKey, buyType: BuyCategoryKey, count: number) {
  const config = PROPERTY_CATEGORIES[categoryKey];
  const mocks = generateAuctionProperties(buyType, count);
  return mocks.map((m) => mockToListing(m, config.title));
}

export function loadCategoryListings(categoryKey: PropertyCategoryKey): PropertyListing[] {
  switch (categoryKey) {
    case "hud-home":
      return loadHudListings().listings.map(hudToListing);

    case "bank-owned": {
      const vrm = loadVrmListings().listings.map(vrmToListing);
      const homesteps = loadHomeStepsListings().listings.map(homestepsToListing);
      const mock = loadMock("bank-owned", "bank-owned", 24);
      return [...vrm, ...homesteps, ...mock].sort((a, b) => b.price - a.price);
    }

    case "auction-property": {
      const gsa = loadGsaRealEstateSales().listings.map(gsaSaleToListing);
      const mock = loadMock("auction-property", "commercial", 24);
      return [...gsa, ...mock];
    }

    case "motivated-seller":
      return loadMock("motivated-seller", "non-bank-owned", 48);

    case "off-market":
      return loadMock("off-market", "short-sale", 48);

    case "foreclosure":
      return loadMock("foreclosure", "foreclosure-homes", 48);

    case "pre-foreclosure":
      return loadMock("pre-foreclosure", "second-chance-foreclosure", 48);

    case "sheriffs-sale":
      return loadMock("sheriffs-sale", "foreclosure-homes", 48).map((l) => ({
        ...l,
        tags: [...l.tags, "Sheriff's Sale"],
        propertyType: "Sheriff's Sale",
      }));

    case "tax-delinquent":
      return loadMock("tax-delinquent", "short-sale", 48).map((l) => ({
        ...l,
        tags: [...l.tags, "Tax Delinquent"],
        propertyType: "Tax Delinquent",
      }));

    default:
      return [];
  }
}
