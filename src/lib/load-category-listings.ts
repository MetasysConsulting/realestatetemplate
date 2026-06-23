import type { PropertyCategoryKey } from "@/lib/property-categories";

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
  imageUrl: string | null;
  hasImage: boolean;
  detailPath: string;
  lat: number;
  lng: number;
  isNew: boolean;
  subtitle?: string;
};

/** @deprecated Use fetchCategoryListings from listings-repository (Supabase only). */
export function loadCategoryListings(_categoryKey: PropertyCategoryKey): PropertyListing[] {
  return [];
}
