import type { BuyCategoryKey } from "@/lib/buy-categories";
import { generateAuctionProperties } from "@/lib/generate-auction-properties";
import { PROPERTY_CATEGORIES } from "@/lib/property-categories";
import type { PropertyListing } from "@/lib/load-category-listings";

export type HomeCategoryRowConfig = {
  key: string;
  title: string;
  morePath: string;
  buyType: BuyCategoryKey;
  categoryLabel: string;
};

export const HOME_CATEGORY_ROWS: HomeCategoryRowConfig[] = [
  {
    key: "foreclosure",
    title: "Foreclosures",
    morePath: PROPERTY_CATEGORIES.foreclosure.path,
    buyType: "foreclosure-homes",
    categoryLabel: PROPERTY_CATEGORIES.foreclosure.title,
  },
  {
    key: "bank-owned",
    title: "Bank Owned",
    morePath: PROPERTY_CATEGORIES["bank-owned"].path,
    buyType: "bank-owned",
    categoryLabel: PROPERTY_CATEGORIES["bank-owned"].title,
  },
  {
    key: "auction-property",
    title: "Auction Properties",
    morePath: PROPERTY_CATEGORIES["auction-property"].path,
    buyType: "commercial",
    categoryLabel: PROPERTY_CATEGORIES["auction-property"].title,
  },
  {
    key: "hud-home",
    title: "HUD Homes",
    morePath: PROPERTY_CATEGORIES["hud-home"].path,
    buyType: "foreclosure-homes",
    categoryLabel: PROPERTY_CATEGORIES["hud-home"].title,
  },
];

const ROW_LISTING_COUNT = 6;

function mockToHomeListing(
  mock: ReturnType<typeof generateAuctionProperties>[number],
  categoryLabel: string,
  detailPath: string,
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
    detailPath,
    lat: mock.lat,
    lng: mock.lng,
    isNew: mock.isNew,
  };
}

export function getHomeCategoryRowListings(row: HomeCategoryRowConfig): PropertyListing[] {
  return generateAuctionProperties(row.buyType, ROW_LISTING_COUNT).map((mock) =>
    mockToHomeListing(mock, row.categoryLabel, row.morePath),
  );
}
