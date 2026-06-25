import type { BuyCategoryKey } from "@/lib/buy-categories";

/** Public URL prefix — matches Buy menu (no standalone /properties hub). */
export const LISTING_ROUTE_PREFIX = "/buy";

export type PropertyCategoryKey =
  | "motivated-seller"
  | "off-market"
  | "foreclosure"
  | "pre-foreclosure"
  | "bank-owned"
  | "auction-property"
  | "sheriffs-sale"
  | "tax-delinquent"
  | "hud-home";

export type PropertyCategoryConfig = {
  key: PropertyCategoryKey;
  path: string;
  title: string;
  navLabel: string;
  description: string;
  /** Mock auction inventory when no scraped feed fills the category */
  mockBuyType?: BuyCategoryKey;
  mockCount?: number;
};

export const PROPERTY_CATEGORIES: Record<PropertyCategoryKey, PropertyCategoryConfig> = {
  "motivated-seller": {
    key: "motivated-seller",
    path: `${LISTING_ROUTE_PREFIX}/motivated-seller`,
    title: "Motivated Seller Properties",
    navLabel: "Motivated Seller Property",
    description: "Owners ready to sell quickly — often below market value.",
    mockBuyType: "non-bank-owned",
    mockCount: 48,
  },
  "off-market": {
    key: "off-market",
    path: `${LISTING_ROUTE_PREFIX}/off-market`,
    title: "Off-Market Properties",
    navLabel: "Off-Market Property",
    description: "Exclusive listings not widely advertised on public MLS feeds.",
    mockBuyType: "short-sale",
    mockCount: 48,
  },
  foreclosure: {
    key: "foreclosure",
    path: `${LISTING_ROUTE_PREFIX}/foreclosure`,
    title: "Foreclosure Properties",
    navLabel: "Foreclosure",
    description: "Properties in active foreclosure or post-foreclosure sale.",
    mockBuyType: "foreclosure-homes",
    mockCount: 48,
  },
  "pre-foreclosure": {
    key: "pre-foreclosure",
    path: `${LISTING_ROUTE_PREFIX}/pre-foreclosure`,
    title: "Pre-Foreclosure Properties",
    navLabel: "Pre-Foreclosure",
    description: "Distressed properties before the auction or bank sale stage.",
    mockBuyType: "second-chance-foreclosure",
    mockCount: 48,
  },
  "bank-owned": {
    key: "bank-owned",
    path: `${LISTING_ROUTE_PREFIX}/bank-owned`,
    title: "Bank Owned Properties",
    navLabel: "Bank Owned",
    description: "REO homes owned by lenders, GSEs, and government agencies.",
    mockBuyType: "bank-owned",
    mockCount: 24,
  },
  "auction-property": {
    key: "auction-property",
    path: `${LISTING_ROUTE_PREFIX}/auction-property`,
    title: "Auction Properties",
    navLabel: "Auction Property",
    description: "Homes and commercial assets offered at public or online auction.",
    mockBuyType: "commercial",
    mockCount: 24,
  },
  "sheriffs-sale": {
    key: "sheriffs-sale",
    path: `${LISTING_ROUTE_PREFIX}/sheriffs-sale`,
    title: "Sheriff's Sale Properties",
    navLabel: "Sheriff's Sale Property",
    description: "Court-ordered sales conducted by county sheriffs.",
    mockBuyType: "foreclosure-homes",
    mockCount: 48,
  },
  "tax-delinquent": {
    key: "tax-delinquent",
    path: `${LISTING_ROUTE_PREFIX}/tax-delinquent`,
    title: "Tax Delinquent Properties",
    navLabel: "Tax Delinquent Property",
    description: "Properties with delinquent tax liens or heading to tax sale.",
    mockBuyType: "short-sale",
    mockCount: 48,
  },
  "hud-home": {
    key: "hud-home",
    path: `${LISTING_ROUTE_PREFIX}/hud-home`,
    title: "HUD Homes",
    navLabel: "HUD Home",
    description: "FHA-insured foreclosure homes listed for sale nationwide.",
  },
};

export const PROPERTY_CATEGORY_SLUGS = Object.keys(
  PROPERTY_CATEGORIES,
) as PropertyCategoryKey[];

export const PROPERTY_CATEGORY_NAV_SLUGS = PROPERTY_CATEGORY_SLUGS.filter(
  (k) => k !== "hud-home",
);

export function resolvePropertyCategory(slug: string): PropertyCategoryConfig | null {
  if (slug in PROPERTY_CATEGORIES) {
    return PROPERTY_CATEGORIES[slug as PropertyCategoryKey];
  }
  return null;
}

export function hudCaseSlug(caseNumber: string): string {
  return encodeURIComponent(caseNumber);
}

export function hudCaseFromSlug(slug: string): string {
  return decodeURIComponent(slug);
}

export function hudDetailPath(caseNumber: string): string {
  return `${LISTING_ROUTE_PREFIX}/hud-home/${hudCaseSlug(caseNumber)}`;
}

export function listingIdSlug(id: string): string {
  return encodeURIComponent(id);
}

export function listingIdFromSlug(slug: string): string {
  return decodeURIComponent(slug);
}

export function bankOwnedDetailPath(listingId: string): string {
  return `${LISTING_ROUTE_PREFIX}/bank-owned/${listingIdSlug(listingId)}`;
}

export function auctionPropertyDetailPath(listingId: string): string {
  return `${LISTING_ROUTE_PREFIX}/auction-property/${listingIdSlug(listingId)}`;
}

export function motivatedSellerDetailPath(listingId: string): string {
  return `${LISTING_ROUTE_PREFIX}/motivated-seller/${listingIdSlug(listingId)}`;
}

export function offMarketDetailPath(listingId: string): string {
  return `${LISTING_ROUTE_PREFIX}/off-market/${listingIdSlug(listingId)}`;
}

export function foreclosureDetailPath(listingId: string): string {
  return `${LISTING_ROUTE_PREFIX}/foreclosure/${listingIdSlug(listingId)}`;
}

export function preForeclosureDetailPath(listingId: string): string {
  return `${LISTING_ROUTE_PREFIX}/pre-foreclosure/${listingIdSlug(listingId)}`;
}

export function propertyRadarDetailPath(category: PropertyCategoryKey, listingId: string): string {
  switch (category) {
    case "off-market":
      return offMarketDetailPath(listingId);
    case "foreclosure":
      return foreclosureDetailPath(listingId);
    case "pre-foreclosure":
      return preForeclosureDetailPath(listingId);
    case "motivated-seller":
    default:
      return motivatedSellerDetailPath(listingId);
  }
}
