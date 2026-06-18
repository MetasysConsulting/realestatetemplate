import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DatabaseListingRow = {
  id: string;
  source_id: string;
  category: string;
  external_id: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  price: number;
  price_label: string;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  lot_size: number | null;
  year_built: string | null;
  property_type: string | null;
  status: string | null;
  tags: string[] | null;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  detail_url: string | null;
  source_agency: string | null;
  is_new: boolean;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  scraped_at: string | null;
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function createSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
