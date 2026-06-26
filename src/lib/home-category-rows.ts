import { PROPERTY_CATEGORIES } from "@/lib/property-categories";
import type { PropertyListing } from "@/lib/load-category-listings";

export type HomeCategoryRowConfig = {
  key: string;
  title: string;
  morePath: string;
  categoryLabel: string;
};

/** Homepage listing rows — keep to three (client request). */
export const HOME_CATEGORY_ROWS: HomeCategoryRowConfig[] = [
  {
    key: "bank-owned",
    title: "Bank Owned",
    morePath: PROPERTY_CATEGORIES["bank-owned"].path,
    categoryLabel: PROPERTY_CATEGORIES["bank-owned"].title,
  },
  {
    key: "foreclosure",
    title: "Foreclosure",
    morePath: PROPERTY_CATEGORIES.foreclosure.path,
    categoryLabel: PROPERTY_CATEGORIES.foreclosure.title,
  },
  {
    key: "motivated-seller",
    title: "Motivated Seller",
    morePath: PROPERTY_CATEGORIES["motivated-seller"].path,
    categoryLabel: PROPERTY_CATEGORIES["motivated-seller"].title,
  },
];

export function resolveHomeCategoryRowListings(
  rowListings: Record<string, PropertyListing[]>,
  row: HomeCategoryRowConfig,
): PropertyListing[] {
  return rowListings[row.key] ?? [];
}
