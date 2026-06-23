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

/** Listings are on by default; set NEXT_PUBLIC_USE_SUPABASE_LISTINGS=false to hide. */
export function areSiteListingsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_SUPABASE_LISTINGS !== "false";
}

function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  if (!areSiteListingsEnabled()) {
    return false;
  }

  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function createSupabaseServerClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key);
}
