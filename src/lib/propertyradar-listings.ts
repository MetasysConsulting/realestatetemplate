import propertyRadarData from "@/data/propertyradar-listings.json";
import type { DatabaseListingRow } from "@/lib/supabase/server";

type PropertyRadarJsonListing = {
  id: string;
  source_id: string;
  category: string;
  external_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  price_label: string;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  property_type: string | null;
  status: string | null;
  tags: string[];
  image_url: string | null;
  source_agency: string | null;
  is_new: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  scraped_at: string;
};

export type PropertyRadarListingsDataset = {
  scrapedAt: string;
  sourceUrl: string;
  count: number;
  listings: DatabaseListingRow[];
};

function toDatabaseRow(raw: PropertyRadarJsonListing): DatabaseListingRow {
  return {
    id: raw.id,
    source_id: raw.source_id,
    category: raw.category,
    external_id: raw.external_id,
    address: raw.address,
    city: raw.city,
    state: raw.state,
    zip: raw.zip,
    county: null,
    price: raw.price,
    price_label: raw.price_label,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    square_footage: raw.square_footage,
    lot_size: null,
    year_built: null,
    property_type: raw.property_type,
    status: raw.status,
    tags: raw.tags,
    lat: null,
    lng: null,
    image_url: raw.image_url,
    detail_url: null,
    source_agency: raw.source_agency,
    is_new: raw.is_new,
    is_active: raw.is_active,
    metadata: raw.metadata,
    scraped_at: raw.scraped_at,
  };
}

export function loadPropertyRadarListings(): PropertyRadarListingsDataset {
  const data = propertyRadarData as {
    scrapedAt: string;
    sourceUrl: string;
    count: number;
    listings: PropertyRadarJsonListing[];
  };

  return {
    scrapedAt: data.scrapedAt,
    sourceUrl: data.sourceUrl,
    count: data.count,
    listings: data.listings.map(toDatabaseRow),
  };
}
