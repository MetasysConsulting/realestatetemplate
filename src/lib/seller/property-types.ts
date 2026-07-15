export type SellerPropertyStatus = "draft" | "pending_payment" | "active" | "inactive";

export type SellerPropertyRow = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  description: string | null;
  status: SellerPropertyStatus;
  createdAt: string;
  updatedAt: string;
};

export type SellerPropertyInput = {
  address: string;
  city: string;
  state: string;
  zip: string;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFootage?: number | null;
  description?: string | null;
};
