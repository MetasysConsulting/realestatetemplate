import {
  PROPERTY_CATEGORIES,
  type PropertyCategoryKey,
} from "@/lib/property-categories";
import {
  detailPathForListingId,
  toListingUnlockId,
} from "@/lib/unlocks/entitlements";

export type MemberListingRow = {
  listingId: string;
  detailPath: string;
  label: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  category: string | null;
  categoryLabel: string | null;
  priceLabel: string | null;
  imageUrl: string | null;
  savedAt: string;
};

type JoinedListing = {
  id?: string;
  category?: string;
  external_id?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  price?: number | null;
  price_label?: string | null;
  image_url?: string | null;
};

function normalizeJoinedListing(value: unknown): JoinedListing | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return (value[0] as JoinedListing | undefined) ?? null;
  }
  return value as JoinedListing;
}

function listingLabel(listingId: string, listing: JoinedListing | null): string {
  if (!listing) return listingId;
  const street = listing.address?.trim();
  const cityState = [listing.city, listing.state].filter(Boolean).join(", ");
  if (street && cityState) return `${street}, ${cityState}`;
  if (street) return street;
  if (cityState) return cityState;
  return listingId;
}

function categoryNavLabel(category: string | null | undefined): string | null {
  if (!category) return null;
  const config = PROPERTY_CATEGORIES[category as PropertyCategoryKey];
  return config?.navLabel ?? category.replace(/-/g, " ");
}

function listingPriceLabel(listing: JoinedListing | null): string | null {
  if (!listing) return null;
  const labeled = listing.price_label?.trim();
  if (labeled) return labeled;
  if (typeof listing.price === "number" && Number.isFinite(listing.price) && listing.price > 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(listing.price);
  }
  return "Price TBD";
}

export function mapFavoriteRow(
  listingId: string,
  savedAt: string,
  listingsJoin: unknown,
): MemberListingRow {
  const listing = normalizeJoinedListing(listingsJoin);
  const normalizedId = toListingUnlockId(listingId);
  return {
    listingId: normalizedId,
    savedAt,
    detailPath: detailPathForListingId(
      normalizedId,
      listing?.category,
      listing?.external_id,
    ),
    label: listingLabel(normalizedId, listing),
    address: listing?.address?.trim() || null,
    city: listing?.city?.trim() || null,
    state: listing?.state?.trim() || null,
    zip: listing?.zip?.trim() || null,
    category: listing?.category?.trim() || null,
    categoryLabel: categoryNavLabel(listing?.category),
    priceLabel: listingPriceLabel(listing),
    imageUrl: listing?.image_url?.trim() || null,
  };
}
