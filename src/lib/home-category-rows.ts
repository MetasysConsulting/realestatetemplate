import { PROPERTY_CATEGORIES } from "@/lib/property-categories";
import type { PropertyListing } from "@/lib/load-category-listings";

export type HomeCategoryRowConfig = {
  key: string;
  title: string;
  morePath: string;
  categoryLabel: string;
};

/** Homepage rows backed by real scraped inventory only. */
export const HOME_CATEGORY_ROWS: HomeCategoryRowConfig[] = [
  {
    key: "bank-owned",
    title: "Bank Owned",
    morePath: PROPERTY_CATEGORIES["bank-owned"].path,
    categoryLabel: PROPERTY_CATEGORIES["bank-owned"].title,
  },
  {
    key: "auction-property",
    title: "Auction Properties",
    morePath: PROPERTY_CATEGORIES["auction-property"].path,
    categoryLabel: PROPERTY_CATEGORIES["auction-property"].title,
  },
  {
    key: "hud-home",
    title: "HUD Homes",
    morePath: PROPERTY_CATEGORIES["hud-home"].path,
    categoryLabel: PROPERTY_CATEGORIES["hud-home"].title,
  },
];

export function resolveHomeCategoryRowListings(
  rowListings: Record<string, PropertyListing[]>,
  row: HomeCategoryRowConfig,
): PropertyListing[] {
  return rowListings[row.key] ?? [];
}
