import type { ListingOwnerContact } from "@/lib/listing-owner-contact";
import type { PropertyCategoryKey } from "@/lib/property-categories";

export type PropertyListing = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  /** Soft-gated browse card — street/price hidden when true (legacy; browse is public now). */
  browseLocked?: boolean;
  price: number;
  priceLabel: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  propertyType: string;
  status: string;
  tags: string[];
  imageUrl: string | null;
  hasImage: boolean;
  detailPath: string;
  lat: number;
  lng: number;
  hasRealCoordinates: boolean;
  isNew: boolean;
  subtitle?: string;
  yearBuilt?: string | null;
  lotSize?: number | null;
  estEquity?: number | null;
  radarId?: string | null;
  detailUrl?: string | null;
  /** Extra gallery URLs when source provides more than imageUrl (e.g. seller listings). */
  galleryImages?: string[];
  /** Optional longer description for detail About section. */
  aboutText?: string | null;
  /** Owner of record / contact — member-only on detail when present. */
  ownerContact?: ListingOwnerContact | null;
};

/** @deprecated Use fetchCategoryListings from listings-repository (Supabase only). */
export function loadCategoryListings(_categoryKey: PropertyCategoryKey): PropertyListing[] {
  return [];
}
