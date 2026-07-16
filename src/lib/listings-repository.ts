import { resolveListingImage } from "@/lib/listing-images";
import { ownerContactFromMetadata } from "@/lib/listing-owner-contact";
import type { BuyCategoryKey } from "@/lib/buy-categories";
import type { GsaDispositionListing, GsaDispositionsDataset } from "@/lib/gsa-dispositions";
import type { GsaRealEstateSale, GsaRealEstateSalesDataset } from "@/lib/gsa-realestatesales";
import type { HomeStepsDataset, HomeStepsListing } from "@/lib/homesteps-listings";
import type { HudListing, HudListingsDataset } from "@/lib/hud-listings";
import type { PropertyListing } from "@/lib/load-category-listings";
import { HOME_CATEGORY_ROWS } from "@/lib/home-category-rows";
import type { PropertyCategoryKey } from "@/lib/property-categories";
import {
  auctionPropertyDetailPath,
  bankOwnedDetailPath,
  hudDetailPath,
  offMarketDetailPath,
  propertyRadarDetailPath,
} from "@/lib/property-categories";
import { SELLER_LISTING_SOURCE_ID } from "@/lib/seller/sync-public-listing";
import {
  areSiteListingsEnabled,
  createSupabaseServerClient,
  isSupabaseConfigured,
  type DatabaseListingRow,
} from "@/lib/supabase/server";
import {
  fetchListingRowFromPostgres,
  fetchListingRowsFromPostgres,
  fetchSourceMetaFromPostgres,
} from "@/lib/supabase/listings-query";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import type { VrmListing, VrmListingsDataset } from "@/lib/vrm-listings";
import { isValidMapBounds, type MapBounds } from "@/lib/map-bounds";
import { rankSearchListings } from "@/lib/search-query";
import { normalizeStateQuery, parseLocationQuery } from "@/lib/us-states";
import { connection } from "next/server";

const LISTING_PAGE_SIZE = 1000;
const HOME_ROW_LISTING_COUNT = 6;

const PROPERTY_RADAR_CATEGORIES = new Set<PropertyCategoryKey>([
  "motivated-seller",
  "off-market",
  "foreclosure",
  "pre-foreclosure",
]);

const BUY_CATEGORY_PROPERTY_RADAR: Partial<Record<BuyCategoryKey, PropertyCategoryKey[]>> = {
  "foreclosure-homes": ["foreclosure", "pre-foreclosure"],
  "second-chance-foreclosure": ["pre-foreclosure"],
  "short-sale": ["off-market"],
  "non-bank-owned": ["motivated-seller"],
};

/** Only treat DB-provided lat/lng as map-ready. Never invent approximate pins. */
function rowHasRealCoordinates(row: DatabaseListingRow): boolean {
  return (
    row.lat != null &&
    row.lng != null &&
    Number.isFinite(Number(row.lat)) &&
    Number.isFinite(Number(row.lng)) &&
    !(Number(row.lat) === 0 && Number(row.lng) === 0)
  );
}

function coordsFromRow(row: DatabaseListingRow): {
  lat: number;
  lng: number;
  hasRealCoordinates: boolean;
} {
  if (!rowHasRealCoordinates(row)) {
    return { lat: 0, lng: 0, hasRealCoordinates: false };
  }
  return {
    lat: Number(row.lat),
    lng: Number(row.lng),
    hasRealCoordinates: true,
  };
}

function metaString(row: DatabaseListingRow, key: string): string {
  const value = row.metadata?.[key];
  return typeof value === "string" ? value : "";
}

function metaBool(row: DatabaseListingRow, key: string): boolean {
  return row.metadata?.[key] === true;
}

function metaNumber(row: DatabaseListingRow, key: string): number {
  const value = row.metadata?.[key];
  return typeof value === "number" ? value : Number(value) || 0;
}

function listingImageFromRow(row: DatabaseListingRow) {
  const resolved = resolveListingImage(row.image_url);
  const hasImage =
    typeof row.has_image === "boolean" ? row.has_image : resolved.hasImage;

  return {
    imageUrl: resolved.imageUrl,
    hasImage,
    displayImageUrl: resolved.imageUrl,
  };
}

async function fetchAllRows(
  sourceId: string,
  options?: { includeInactive?: boolean },
): Promise<DatabaseListingRow[]> {
  const pgRows = await fetchListingRowsFromPostgres({
    sourceId,
    includeInactive: options?.includeInactive,
  });
  if (pgRows) return pgRows;

  const client = createSupabaseServerClient();
  if (!client) return [];

  const rows: DatabaseListingRow[] = [];
  let from = 0;

  while (true) {
    const to = from + LISTING_PAGE_SIZE - 1;
    let query = client
      .from("listings")
      .select("*")
      .eq("source_id", sourceId)
      .order("price", { ascending: false })
      .range(from, to);

    if (!options?.includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[listings-repository] Supabase query failed:", error.message);
      return [];
    }

    if (!data?.length) break;
    rows.push(...(data as DatabaseListingRow[]));
    if (data.length < LISTING_PAGE_SIZE) break;
    from += LISTING_PAGE_SIZE;
  }

  return rows;
}

async function fetchPropertyRadarRows(): Promise<DatabaseListingRow[]> {
  connection();
  if (!isSupabaseConfigured()) return [];
  return fetchAllRows("propertyradar");
}

async function fetchPropertyRadarCategoryListings(
  categoryKey: PropertyCategoryKey,
): Promise<PropertyListing[]> {
  connection();
  const rows = await fetchPropertyRadarRows();
  return rows
    .filter((row) => row.category === categoryKey)
    .map(propertyRadarToPropertyListing)
    .sort((a, b) => b.price - a.price);
}

async function fetchSellerPublicListings(): Promise<PropertyListing[]> {
  connection();
  if (!isSupabaseConfigured()) return [];
  const rows = await fetchAllRows(SELLER_LISTING_SOURCE_ID);
  return rows
    .map(sellerToPropertyListing)
    .sort((a, b) => b.price - a.price);
}

async function fetchPropertyRadarListingsForBuyCategory(
  buyType: BuyCategoryKey,
): Promise<PropertyListing[]> {
  const categories = BUY_CATEGORY_PROPERTY_RADAR[buyType];
  if (!categories?.length) return [];

  const categorySet = new Set<PropertyCategoryKey>(categories);
  const rows = await fetchPropertyRadarRows();
  return rows
    .filter((row) => categorySet.has(row.category as PropertyCategoryKey))
    .map(propertyRadarToPropertyListing)
    .sort((a, b) => b.price - a.price);
}

async function fetchSourceMeta(sourceId: string): Promise<{ scrapedAt: string; sourceUrl: string }> {
  const pgMeta = await fetchSourceMetaFromPostgres(sourceId);
  if (pgMeta) return pgMeta;

  const client = createSupabaseServerClient();
  if (!client) return { scrapedAt: new Date().toISOString(), sourceUrl: "" };

  const { data } = await client
    .from("listing_sources")
    .select("last_scraped_at, source_url")
    .eq("id", sourceId)
    .maybeSingle();

  return {
    scrapedAt: data?.last_scraped_at ?? new Date().toISOString(),
    sourceUrl: data?.source_url ?? "",
  };
}

function rowToHudListing(row: DatabaseListingRow): HudListing {
  const caseNumber = metaString(row, "caseNumber") || row.external_id || "";
  const image = listingImageFromRow(row);
  return {
    id: row.id,
    caseNumber,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    county: row.county ?? "",
    listPrice: Number(row.price) || 0,
    bedrooms: row.bedrooms ?? 0,
    bathrooms: Number(row.bathrooms) || 0,
    squareFootage: row.square_footage ?? 0,
    yearBuilt: row.year_built ?? "",
    propertyType: row.property_type ?? "",
    listingPeriod: metaString(row, "listingPeriod"),
    propertyStatus: row.status ?? "Active",
    listDate: metaString(row, "listDate"),
    bidOpenDate: metaString(row, "bidOpenDate"),
    periodDeadlineDate: metaString(row, "periodDeadlineDate"),
    fhaFinancing: metaString(row, "fhaFinancing"),
    eligibleBidders: metaString(row, "eligibleBidders"),
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    hasRealCoordinates: rowHasRealCoordinates(row),
    imageUrl: image.imageUrl,
    hasImage: image.hasImage,
    displayImageUrl: image.displayImageUrl,
    detailUrl: row.detail_url ?? "",
    sourceUrl: metaString(row, "sourceUrl"),
    sourceAgency: row.source_agency ?? "HUD",
  };
}

function rowToVrmListing(row: DatabaseListingRow): VrmListing {
  const { lat, lng, hasRealCoordinates } = coordsFromRow(row);
  const image = listingImageFromRow(row);
  return {
    id: row.id,
    propertyId: row.external_id ?? metaString(row, "propertyId"),
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    county: row.county ?? "",
    listPrice: Number(row.price) || 0,
    bedrooms: row.bedrooms ?? 0,
    bathrooms: Number(row.bathrooms) || 0,
    squareFootage: row.square_footage ?? 0,
    lotSize: Number(row.lot_size) || 0,
    status: row.status ?? "For Sale",
    isNew: row.is_new,
    isVendeeFinancing: metaBool(row, "isVendeeFinancing"),
    imageUrl: image.imageUrl,
    hasImage: image.hasImage,
    displayImageUrl: image.displayImageUrl,
    detailUrl: row.detail_url ?? "",
    sourceUrl: metaString(row, "sourceUrl"),
    sourceAgency: row.source_agency ?? "VRM Properties",
    lat,
    lng,
    hasRealCoordinates,
  };
}

function rowToHomeStepsListing(row: DatabaseListingRow): HomeStepsListing {
  const image = listingImageFromRow(row);
  return {
    id: row.id,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    listPrice: Number(row.price) || 0,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    hasRealCoordinates: rowHasRealCoordinates(row),
    imageUrl: image.imageUrl,
    hasImage: image.hasImage,
    displayImageUrl: image.displayImageUrl,
    detailUrl: row.detail_url ?? "",
    sourceUrl: metaString(row, "sourceUrl"),
    sourceAgency: row.source_agency ?? "Freddie Mac HomeSteps",
    searchState: metaString(row, "searchState") || row.state,
  };
}

function rowToGsaSale(row: DatabaseListingRow, index: number): GsaRealEstateSale {
  const { lat, lng, hasRealCoordinates } = coordsFromRow(row);
  const image = listingImageFromRow(row);
  return {
    id: row.id,
    propertyId: row.external_id ?? metaString(row, "propertyId"),
    title: metaString(row, "title"),
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    startingBid: Number(row.price) || 0,
    status: row.status ?? "Available",
    auctionType: metaString(row, "auctionType") || "Online Auction",
    propertyType: row.property_type ?? "",
    imageUrl: image.imageUrl,
    hasImage: image.hasImage,
    displayImageUrl: image.displayImageUrl,
    detailUrl: row.detail_url ?? "",
    sourceUrl: metaString(row, "sourceUrl"),
    sourceAgency: row.source_agency ?? "GSA",
    lat,
    lng,
    hasRealCoordinates,
  };
}

function rowToGsaDisposition(row: DatabaseListingRow, index: number): GsaDispositionListing {
  const { lat, lng, hasRealCoordinates } = coordsFromRow(row);
  const status = row.status === "UNDER CONTRACT" || row.status === "SOLD" ? row.status : "Available";
  const rentableSqFt = Number(row.metadata?.rentableSqFt) || row.square_footage || 0;
  const image = listingImageFromRow(row);

  return {
    id: row.id,
    title: metaString(row, "title"),
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    propertyType: row.property_type ?? "",
    rentableSqFt,
    dateListed: metaString(row, "dateListed"),
    status,
    sourceUrl: metaString(row, "sourceUrl") || row.detail_url || "",
    sourceAgency: row.source_agency ?? "GSA",
    imageUrl: image.imageUrl,
    imageNote: metaString(row, "imageNote") || undefined,
    lat,
    lng,
    hasRealCoordinates,
    hasImage: image.hasImage,
    displayImageUrl: image.displayImageUrl,
  };
}

function hudToPropertyListing(h: HudListing): PropertyListing {
  return {
    id: h.id,
    address: h.address,
    city: h.city,
    state: h.state,
    zip: h.zip,
    price: h.listPrice,
    priceLabel: "List Price",
    bedrooms: h.bedrooms,
    bathrooms: h.bathrooms,
    squareFootage: h.squareFootage,
    propertyType: h.propertyType,
    status: h.propertyStatus || "Active",
    tags: [h.propertyType, h.listingPeriod].filter(Boolean),
    imageUrl: h.imageUrl,
    hasImage: h.hasImage,
    detailPath: hudDetailPath(h.caseNumber),
    lat: h.lat,
    lng: h.lng,
    hasRealCoordinates: h.hasRealCoordinates,
    isNew: false,
    subtitle: `Case #${h.caseNumber}`,
  };
}

function homestepsToPropertyListing(l: HomeStepsListing): PropertyListing {
  return {
    id: l.id,
    address: l.address,
    city: l.city,
    state: l.state,
    zip: l.zip,
    price: l.listPrice,
    priceLabel: "List Price",
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    propertyType: "Bank Owned",
    status: "For Sale",
    tags: ["Freddie Mac", "REO"],
    imageUrl: l.imageUrl,
    hasImage: l.hasImage,
    detailPath: bankOwnedDetailPath(l.id),
    lat: l.lat,
    lng: l.lng,
    hasRealCoordinates: l.hasRealCoordinates,
    isNew: false,
  };
}

function vrmToPropertyListing(l: VrmListing): PropertyListing {
  return {
    id: l.id,
    address: l.address,
    city: l.city,
    state: l.state,
    zip: l.zip,
    price: l.listPrice,
    priceLabel: "List Price",
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    squareFootage: l.squareFootage,
    propertyType: "VA REO",
    status: l.status,
    tags: l.isVendeeFinancing ? ["VA REO", "Vendee Financing"] : ["VA REO"],
    imageUrl: l.imageUrl,
    hasImage: l.hasImage,
    detailPath: bankOwnedDetailPath(l.id),
    lat: l.lat,
    lng: l.lng,
    hasRealCoordinates: l.hasRealCoordinates,
    isNew: l.isNew,
  };
}

function gsaSaleToPropertyListing(l: GsaRealEstateSale): PropertyListing {
  return {
    id: l.id,
    address: l.address,
    city: l.city,
    state: l.state,
    zip: l.zip,
    price: l.startingBid,
    priceLabel: "Starting Bid",
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    propertyType: l.propertyType,
    status: l.status,
    tags: [l.auctionType, "Federal Auction"],
    imageUrl: l.imageUrl,
    hasImage: l.hasImage,
    detailPath: auctionPropertyDetailPath(l.id),
    lat: l.lat,
    lng: l.lng,
    hasRealCoordinates: l.hasRealCoordinates,
    isNew: false,
    subtitle: l.title,
  };
}

function propertyRadarToPropertyListing(row: DatabaseListingRow): PropertyListing {
  const category = row.category as PropertyCategoryKey;
  const distressScore = Number(row.metadata?.distressScore) || 0;
  const estEquity = metaNumber(row, "estEquity") || undefined;
  const radarId = metaString(row, "radarId") || undefined;
  const { lat, lng, hasRealCoordinates } = coordsFromRow(row);
  const image = listingImageFromRow(row);
  const ownerContact = ownerContactFromMetadata(
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : null,
  );

  return {
    id: row.id,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    price: Number(row.price) || 0,
    priceLabel: row.price_label || "Est. Value",
    bedrooms: row.bedrooms ?? 0,
    bathrooms: Number(row.bathrooms) || 0,
    squareFootage: row.square_footage ?? 0,
    propertyType: row.property_type ?? "Residential",
    status: row.status ?? "Off Market",
    tags: row.tags ?? ["PropertyRadar"],
    imageUrl: image.imageUrl,
    hasImage: image.hasImage,
    detailPath: propertyRadarDetailPath(category, row.id),
    lat,
    lng,
    hasRealCoordinates,
    isNew: row.is_new ?? false,
    subtitle: distressScore > 0 ? `Distress score ${distressScore}` : undefined,
    yearBuilt: row.year_built,
    lotSize: row.lot_size != null ? Number(row.lot_size) : null,
    estEquity: estEquity || null,
    radarId: radarId || null,
    detailUrl: row.detail_url,
    ownerContact,
  };
}

function sellerToPropertyListing(row: DatabaseListingRow): PropertyListing {
  const { lat, lng, hasRealCoordinates } = coordsFromRow(row);
  const image = listingImageFromRow(row);
  const meta =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};
  const galleryFromMeta = Array.isArray(meta.imageUrls)
    ? meta.imageUrls.map((u) => String(u)).filter(Boolean)
    : [];
  const galleryImages = Array.from(
    new Set([image.imageUrl, ...galleryFromMeta].filter(Boolean) as string[]),
  );
  const title = meta.title ? String(meta.title).trim() : "";
  const aboutText = meta.description ? String(meta.description).trim() : "";

  return {
    id: row.id,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    price: Number(row.price) || 0,
    priceLabel: row.price_label || "List Price",
    bedrooms: row.bedrooms ?? 0,
    bathrooms: Number(row.bathrooms) || 0,
    squareFootage: row.square_footage ?? 0,
    propertyType: row.property_type ?? "Residential",
    status: row.status ?? "For Sale",
    tags: row.tags?.length ? row.tags : ["Seller listing", "FSBO"],
    imageUrl: image.imageUrl ?? galleryImages[0] ?? null,
    hasImage: image.hasImage || galleryImages.length > 0,
    detailPath: offMarketDetailPath(row.id),
    lat,
    lng,
    hasRealCoordinates,
    isNew: row.is_new ?? false,
    subtitle: title || "Seller listing on REOVANA",
    yearBuilt: row.year_built,
    lotSize: row.lot_size != null ? Number(row.lot_size) : null,
    detailUrl: row.detail_url,
    galleryImages,
    aboutText: aboutText || null,
    ownerContact: null,
  };
}

function listingToAuctionProperty(listing: PropertyListing, buyType: BuyCategoryKey): AuctionProperty {
  return {
    id: listing.id,
    isNew: listing.isNew,
    openingBid: listing.price,
    tags: listing.tags,
    category: listing.propertyType,
    buyType,
    address: listing.address,
    city: listing.city,
    state: listing.state,
    zip: listing.zip,
    beds: listing.bedrooms,
    baths: listing.bathrooms,
    sqft: listing.squareFootage,
    auctionDate: "",
    auctionTime: "",
    status: listing.status,
    lat: listing.lat,
    lng: listing.lng,
    hasRealCoordinates: listing.hasRealCoordinates,
    imageUrl: listing.imageUrl,
    hasImage: listing.hasImage,
    detailUrl: listing.detailPath,
  };
}

function gsaDispositionToPropertyListing(l: GsaDispositionListing): PropertyListing {
  return {
    id: l.id,
    address: l.address,
    city: l.city,
    state: l.state,
    zip: l.zip,
    price: 0,
    priceLabel: "Federal Disposition",
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: l.rentableSqFt,
    propertyType: l.propertyType,
    status: l.status,
    tags: [l.propertyType, "GSA Disposition"].filter(Boolean),
    imageUrl: l.imageUrl,
    hasImage: l.hasImage,
    detailPath: auctionPropertyDetailPath(l.id),
    lat: l.lat,
    lng: l.lng,
    hasRealCoordinates: l.hasRealCoordinates,
    isNew: false,
    subtitle: l.title,
  };
}

function gsaDispositionToAuctionProperty(
  listing: GsaDispositionListing,
  buyType: BuyCategoryKey,
): AuctionProperty {
  return {
    id: listing.id,
    isNew: false,
    openingBid: 0,
    tags: [listing.propertyType, listing.status].filter(Boolean),
    category: listing.propertyType,
    buyType,
    address: listing.address,
    city: listing.city,
    state: listing.state,
    zip: listing.zip,
    beds: 0,
    baths: 0,
    sqft: listing.rentableSqFt,
    auctionDate: listing.dateListed,
    auctionTime: "",
    status: listing.status,
    lat: listing.lat,
    lng: listing.lng,
    hasRealCoordinates: listing.hasRealCoordinates,
    imageUrl: listing.imageUrl,
    hasImage: listing.hasImage,
    detailUrl: auctionPropertyDetailPath(listing.id),
  };
}

export async function fetchHudListingsDataset(): Promise<HudListingsDataset> {
  if (!areSiteListingsEnabled() || !isSupabaseConfigured()) {
    return { scrapedAt: "", sourceUrl: "", count: 0, listings: [] };
  }

  const rows = await fetchAllRows("hud");
  if (!rows.length) {
    return { scrapedAt: "", sourceUrl: "", count: 0, listings: [] };
  }

  const meta = await fetchSourceMeta("hud");
  const listings = rows.map(rowToHudListing);

  return {
    scrapedAt: meta.scrapedAt,
    sourceUrl: meta.sourceUrl || "https://www.hudhomestore.gov",
    count: listings.length,
    listings,
  };
}

export async function fetchHudListingByCaseNumber(caseNumber: string): Promise<HudListing | null> {
  if (!areSiteListingsEnabled() || !isSupabaseConfigured()) return null;

  const pgRow = await fetchListingRowFromPostgres({
    sourceId: "hud",
    externalId: caseNumber,
  });
  if (pgRow) return rowToHudListing(pgRow);

  const client = createSupabaseServerClient();
  if (!client) return null;

  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("source_id", "hud")
    .eq("is_active", true)
    .eq("external_id", caseNumber)
    .maybeSingle();

  if (error || !data) return null;

  return rowToHudListing(data as DatabaseListingRow);
}

export async function fetchAllHudCaseNumbers(): Promise<string[]> {
  if (!areSiteListingsEnabled()) return [];
  const dataset = await fetchHudListingsDataset();
  return dataset.listings.map((l) => l.caseNumber);
}

export async function fetchVrmListingsDataset(): Promise<VrmListingsDataset> {
  if (!areSiteListingsEnabled() || !isSupabaseConfigured()) {
    return { scrapedAt: "", sourceUrl: "", count: 0, listings: [] };
  }

  const rows = await fetchAllRows("vrm");
  if (!rows.length) {
    return { scrapedAt: "", sourceUrl: "", count: 0, listings: [] };
  }

  const meta = await fetchSourceMeta("vrm");
  const listings = rows.map(rowToVrmListing);

  return {
    scrapedAt: meta.scrapedAt,
    sourceUrl: meta.sourceUrl || "https://www.vrmproperties.com",
    count: listings.length,
    listings,
  };
}

export async function fetchHomeStepsListingsDataset(): Promise<HomeStepsDataset> {
  if (!areSiteListingsEnabled() || !isSupabaseConfigured()) {
    return { scrapedAt: "", sourceUrl: "", count: 0, listings: [] };
  }

  const rows = await fetchAllRows("homesteps");
  if (!rows.length) {
    return { scrapedAt: "", sourceUrl: "", count: 0, listings: [] };
  }

  const meta = await fetchSourceMeta("homesteps");
  const listings = rows.map(rowToHomeStepsListing);

  return {
    scrapedAt: meta.scrapedAt,
    sourceUrl: meta.sourceUrl || "https://www.homesteps.com",
    count: listings.length,
    listings,
  };
}

export async function fetchGsaRealEstateSalesDataset(): Promise<GsaRealEstateSalesDataset> {
  if (!areSiteListingsEnabled() || !isSupabaseConfigured()) {
    return { scrapedAt: "", sourceUrl: "", count: 0, listings: [] };
  }

  const rows = await fetchAllRows("gsa-sales");
  if (!rows.length) {
    return { scrapedAt: "", sourceUrl: "", count: 0, listings: [] };
  }

  const meta = await fetchSourceMeta("gsa-sales");
  const listings = rows.map((row, index) => rowToGsaSale(row, index));

  return {
    scrapedAt: meta.scrapedAt,
    sourceUrl: meta.sourceUrl || "https://www.realestatesales.gov",
    count: listings.length,
    listings,
  };
}

export async function fetchGsaDispositionsDataset(): Promise<GsaDispositionsDataset> {
  if (!areSiteListingsEnabled() || !isSupabaseConfigured()) {
    return { scrapedAt: "", sourceUrl: "", count: 0, listings: [] };
  }

  const rows = await fetchAllRows("gsa-dispositions", { includeInactive: true });
  if (!rows.length) {
    return { scrapedAt: "", sourceUrl: "", count: 0, listings: [] };
  }

  const meta = await fetchSourceMeta("gsa-dispositions");
  const listings = rows.map((row, index) => rowToGsaDisposition(row, index));

  return {
    scrapedAt: meta.scrapedAt,
    sourceUrl:
      meta.sourceUrl ||
      "https://www.gsa.gov/real-estate/real-property-disposition/assets-identified-for-accelerated-disposition",
    count: listings.length,
    listings,
  };
}

export async function fetchSourceMetaForPropertyRadar(): Promise<{ scrapedAt: string; sourceUrl: string }> {
  return fetchSourceMeta("propertyradar");
}

export async function fetchPropertyListingById(listingId: string): Promise<PropertyListing | null> {
  if (!areSiteListingsEnabled() || !isSupabaseConfigured()) return null;

  if (listingId.startsWith("hud-")) {
    return null;
  }

  const pgRow = await fetchListingRowFromPostgres({ id: listingId });
  if (pgRow) {
    return rowToPropertyListing(pgRow);
  }

  const client = createSupabaseServerClient();
  if (!client) return null;

  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  return rowToPropertyListing(data as DatabaseListingRow);
}

function rowToPropertyListing(row: DatabaseListingRow): PropertyListing | null {
  if (row.source_id === "hud") {
    return hudToPropertyListing(rowToHudListing(row));
  }
  if (row.source_id === "vrm") {
    return vrmToPropertyListing(rowToVrmListing(row));
  }
  if (row.source_id === "homesteps") {
    return homestepsToPropertyListing(rowToHomeStepsListing(row));
  }
  if (row.source_id === "gsa-sales") {
    return gsaSaleToPropertyListing(rowToGsaSale(row, 0));
  }
  if (row.source_id === "gsa-dispositions") {
    return gsaDispositionToPropertyListing(rowToGsaDisposition(row, 0));
  }
  if (row.source_id === "propertyradar") {
    return propertyRadarToPropertyListing(row);
  }
  if (row.source_id === SELLER_LISTING_SOURCE_ID || row.source_id === "seller") {
    return sellerToPropertyListing(row);
  }

  return null;
}

export async function fetchCategoryListings(categoryKey: PropertyCategoryKey): Promise<PropertyListing[]> {
  if (!areSiteListingsEnabled()) return [];

  switch (categoryKey) {
    case "hud-home": {
      const dataset = await fetchHudListingsDataset();
      return dataset.listings.map(hudToPropertyListing);
    }

    case "bank-owned": {
      const [vrm, homesteps] = await Promise.all([
        fetchVrmListingsDataset(),
        fetchHomeStepsListingsDataset(),
      ]);
      return [...vrm.listings.map(vrmToPropertyListing), ...homesteps.listings.map(homestepsToPropertyListing)].sort(
        (a, b) => b.price - a.price,
      );
    }

    case "auction-property": {
      const [gsa, dispositions] = await Promise.all([
        fetchGsaRealEstateSalesDataset(),
        fetchGsaDispositionsDataset(),
      ]);
      return [
        ...gsa.listings.map(gsaSaleToPropertyListing),
        ...dispositions.listings.map(gsaDispositionToPropertyListing),
      ];
    }

    case "motivated-seller":
    case "foreclosure":
    case "pre-foreclosure": {
      if (!PROPERTY_RADAR_CATEGORIES.has(categoryKey)) return [];
      return fetchPropertyRadarCategoryListings(categoryKey);
    }

    case "off-market": {
      const [radar, seller] = await Promise.all([
        fetchPropertyRadarCategoryListings("off-market"),
        fetchSellerPublicListings(),
      ]);
      return [...seller, ...radar].sort((a, b) => b.price - a.price);
    }

    case "sheriffs-sale":
    case "tax-delinquent":
      return [];

    default:
      return [];
  }
}

type SearchListingsOptions = {
  q?: string;
  state?: string;
  propertyType?: string;
  beds?: number;
  baths?: number;
  minPrice?: number;
  maxPrice?: number;
  /** Inclusive viewport filter (AND with other filters). */
  bounds?: MapBounds | null;
  page?: number;
  pageSize?: number;
};

export async function searchListings(
  options: SearchListingsOptions,
): Promise<{ listings: PropertyListing[]; total?: number }> {
  connection();
  if (!areSiteListingsEnabled() || !isSupabaseConfigured()) return { listings: [] };

  const client = createSupabaseServerClient();
  if (!client) return { listings: [] };

  const q = (options.q ?? "").trim();
  const state = normalizeStateQuery(options.state ?? "");
  const propertyType = (options.propertyType ?? "").trim();
  const beds = Math.max(0, options.beds ?? 0);
  const baths = Math.max(0, options.baths ?? 0);
  const minPrice = Math.max(0, options.minPrice ?? 0);
  const maxPrice = Math.max(0, options.maxPrice ?? 0);
  const pageSize = Math.min(500, Math.max(10, options.pageSize ?? 100));
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("listings")
    .select("*", { count: "estimated" })
    .eq("is_active", true);

  const parsed = parseLocationQuery(q);
  const searchQ = parsed.q;
  const parsedZip = parsed.zip;
  const parsedState = parsed.state || state;

  if (parsedState) {
    if (parsedState.length === 2) {
      query = query.eq("state", parsedState.toUpperCase());
    } else {
      query = query.ilike("state", `%${parsedState}%`);
    }
  }

  if (propertyType) {
    query = query.ilike("property_type", `%${propertyType.replace(/[%_\\]/g, "\\$&")}%`);
  }

  if (beds) {
    query = query.gte("bedrooms", beds);
  }

  if (baths) {
    query = query.gte("bathrooms", baths);
  }

  if (minPrice) {
    query = query.gte("price", minPrice);
  }

  if (maxPrice) {
    query = query.lte("price", maxPrice);
  }

  // ZIP is an AND filter when we know it (e.g. "Los Angeles, CA 90012").
  if (parsedZip) {
    query = query.like("zip", `${parsedZip}%`);
  }

  if (isValidMapBounds(options.bounds)) {
    const { minLat, maxLat, minLng, maxLng } = options.bounds;
    query = query
      .not("lat", "is", null)
      .not("lng", "is", null)
      .gte("lat", minLat)
      .lte("lat", maxLat)
      .gte("lng", minLng)
      .lte("lng", maxLng);
  }

  if (searchQ) {
    const escaped = searchQ.replace(/[%_,\\]/g, "\\$&");
    const clauses = [
      `address.ilike.%${escaped}%`,
      `city.ilike.%${escaped}%`,
      `county.ilike.%${escaped}%`,
      `property_type.ilike.%${escaped}%`,
    ];
    // Only ILIKE state text when we did not already apply a state filter —
    // otherwise "CA" / "California" would never match abbr storage correctly.
    if (!parsedState) {
      clauses.push(`state.ilike.%${escaped}%`);
    }
    if (/^\d+$/.test(searchQ)) {
      clauses.push(`zip.like.${searchQ}%`);
    }
    query = query.or(clauses.join(","));
  }

  const { data, error, count } = await query
    .order("price", { ascending: false })
    .range(from, to);

  if (error || !data) {
    console.error("[listings-repository] searchListings failed:", error?.message ?? "unknown error");
    return { listings: [] };
  }

  const listings = rankSearchListings(
    (data as DatabaseListingRow[]).map(rowToPropertyListing).filter(Boolean) as PropertyListing[],
    q,
  );

  return { listings, total: typeof count === "number" ? count : undefined };
}

export async function fetchHomeCategoryRows(): Promise<Record<string, PropertyListing[]>> {
  const entries = await Promise.all(
    HOME_CATEGORY_ROWS.map(async (row) => {
      const listings = await fetchCategoryListings(row.key as PropertyCategoryKey);
      return [row.key, listings.slice(0, HOME_ROW_LISTING_COUNT)] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export async function fetchAuctionProperties(categoryKey: BuyCategoryKey): Promise<AuctionProperty[]> {
  switch (categoryKey) {
    case "bank-owned": {
      const listings = await fetchCategoryListings("bank-owned");
      return listings.map((listing) => listingToAuctionProperty(listing, categoryKey));
    }

    case "foreclosure-homes":
    case "second-chance-foreclosure":
    case "short-sale":
    case "non-bank-owned": {
      const listings = await fetchPropertyRadarListingsForBuyCategory(categoryKey);
      return listings.map((listing) => listingToAuctionProperty(listing, categoryKey));
    }

    case "commercial": {
      const [sales, dispositions] = await Promise.all([
        fetchGsaRealEstateSalesDataset(),
        fetchGsaDispositionsDataset(),
      ]);
      return [
        ...sales.listings.map((listing) =>
          listingToAuctionProperty(gsaSaleToPropertyListing(listing), categoryKey),
        ),
        ...dispositions.listings.map((listing) =>
          gsaDispositionToAuctionProperty(listing, categoryKey),
        ),
      ];
    }

    case "all": {
      const [hud, bankOwned, auction, foreclosure, motivatedSeller, offMarket, preForeclosure] =
        await Promise.all([
        fetchCategoryListings("hud-home"),
        fetchCategoryListings("bank-owned"),
        fetchCategoryListings("auction-property"),
        fetchCategoryListings("foreclosure"),
        fetchCategoryListings("motivated-seller"),
        fetchCategoryListings("off-market"),
        fetchCategoryListings("pre-foreclosure"),
      ]);
      return [...hud, ...bankOwned, ...auction, ...foreclosure, ...motivatedSeller, ...offMarket, ...preForeclosure]
        .map((listing) => listingToAuctionProperty(listing, "all"))
        .sort((a, b) => b.openingBid - a.openingBid);
    }

    default:
      return [];
  }
}
