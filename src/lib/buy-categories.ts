export type BuyCategoryKey =
  | "all"
  | "foreclosure-homes"
  | "bank-owned"
  | "second-chance-foreclosure"
  | "short-sale"
  | "commercial"
  | "non-bank-owned";

export type BuyCategoryConfig = {
  key: BuyCategoryKey;
  path: string;
  title: string;
  navLabel: string;
  /** Match generated property buyType */
  buyType: BuyCategoryKey;
};

export const BUY_CATEGORIES: Record<BuyCategoryKey, BuyCategoryConfig> = {
  all: {
    key: "all",
    path: "/auctions",
    title: "All Auction Homes",
    navLabel: "All Auction Homes",
    buyType: "all",
  },
  "foreclosure-homes": {
    key: "foreclosure-homes",
    path: "/auctions/foreclosure-homes",
    title: "Foreclosure Homes",
    navLabel: "Foreclosure Homes",
    buyType: "foreclosure-homes",
  },
  "bank-owned": {
    key: "bank-owned",
    path: "/auctions/bank-owned",
    title: "Bank Owned",
    navLabel: "Bank Owned",
    buyType: "bank-owned",
  },
  "second-chance-foreclosure": {
    key: "second-chance-foreclosure",
    path: "/auctions/second-chance-foreclosure",
    title: "2nd Chance Foreclosure",
    navLabel: "2nd Chance Foreclosure",
    buyType: "second-chance-foreclosure",
  },
  "short-sale": {
    key: "short-sale",
    path: "/auctions/short-sale",
    title: "Short Sale",
    navLabel: "Short Sale",
    buyType: "short-sale",
  },
  commercial: {
    key: "commercial",
    path: "/auctions/commercial",
    title: "Commercial",
    navLabel: "Commercial",
    buyType: "commercial",
  },
  "non-bank-owned": {
    key: "non-bank-owned",
    path: "/auctions/non-bank-owned",
    title: "Non-Bank Owned",
    navLabel: "Non-Bank Owned",
    buyType: "non-bank-owned",
  },
};

export const BUY_CATEGORY_SLUGS = Object.keys(BUY_CATEGORIES).filter(
  (k) => k !== "all",
) as Exclude<BuyCategoryKey, "all">[];

export function resolveBuyCategory(
  slugSegments?: string[],
): BuyCategoryConfig {
  const slug = slugSegments?.[0];
  if (!slug) return BUY_CATEGORIES.all;

  const key = slug as BuyCategoryKey;
  if (key in BUY_CATEGORIES && key !== "all") {
    return BUY_CATEGORIES[key];
  }

  return BUY_CATEGORIES.all;
}
