export type SellerPropertyStatus = "draft" | "pending_payment" | "active" | "inactive";

export type SellerPropertyRow = {
  id: string;
  title: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  garage: number | null;
  propertyType: string | null;
  listingStatus: string | null;
  description: string | null;
  videoUrl: string | null;
  virtualTourUrl: string | null;
  lat: number | null;
  lng: number | null;
  imageUrls: string[];
  status: SellerPropertyStatus;
  createdAt: string;
  updatedAt: string;
};

export type SellerPropertyInput = {
  title?: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  county?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFootage?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  garage?: number | null;
  propertyType?: string | null;
  listingStatus?: string | null;
  description?: string | null;
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  imageUrls?: string[];
};

export const SELLER_PROPERTY_TYPES = [
  "Single Family",
  "Multi-Family",
  "Condo",
  "Townhouse",
  "Land",
  "Commercial",
  "Other",
] as const;

export const SELLER_LISTING_STATUSES = [
  "For Sale",
  "Pending",
  "Foreclosure",
  "Short Sale",
  "Auction",
  "REO / Bank Owned",
] as const;
