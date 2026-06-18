import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import type { BuyCategoryKey } from "@/lib/buy-categories";
import { generateAuctionProperties } from "@/lib/generate-auction-properties";
import type { GsaDispositionListing, GsaDispositionsDataset } from "@/lib/gsa-dispositions";
import { loadGsaDispositions } from "@/lib/gsa-dispositions";
import type { GsaRealEstateSale, GsaRealEstateSalesDataset } from "@/lib/gsa-realestatesales";
import { loadGsaRealEstateSales } from "@/lib/gsa-realestatesales";
import type { HomeStepsDataset, HomeStepsListing } from "@/lib/homesteps-listings";
import { loadHomeStepsListings } from "@/lib/homesteps-listings";
import type { HudListing, HudListingsDataset } from "@/lib/hud-listings";
import { loadHudListings } from "@/lib/hud-listings";
import type { PropertyListing } from "@/lib/load-category-listings";
import type { PropertyCategoryKey } from "@/lib/property-categories";
import { hudDetailPath, PROPERTY_CATEGORIES } from "@/lib/property-categories";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  type DatabaseListingRow,
} from "@/lib/supabase/server";
import type { VrmListing, VrmListingsDataset } from "@/lib/vrm-listings";
import { loadVrmListings } from "@/lib/vrm-listings";

const LISTING_PAGE_SIZE = 1000;

const VRM_STATE_COORDS: Record<string, [number, number]> = {
  TX: [31.054487, -97.563461],
  FL: [27.766279, -81.686783],
  CA: [36.116203, -119.681564],
  GA: [33.040619, -83.643074],
  AZ: [33.729759, -111.431221],
  OH: [40.388783, -82.764915],
  IL: [40.349457, -88.986137],
  PA: [40.590752, -77.209755],
  NY: [42.165726, -74.948051],
  MI: [43.326618, -84.536095],
  NC: [35.630066, -79.806419],
  VA: [37.769337, -78.169968],
  CO: [39.059811, -105.311104],
  TN: [35.747845, -86.692345],
};

const GSA_STATE_COORDS: Record<string, [number, number]> = {
  TX: [31.054487, -97.563461],
  FL: [27.766279, -81.686783],
  CA: [36.116203, -119.681564],
  VA: [37.769337, -78.169968],
  DC: [38.907192, -77.036871],
};

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function vrmCoords(id: string, state: string): [number, number] {
  const base = VRM_STATE_COORDS[state] ?? [39.8283, -98.5795];
  const spread = hashString(id) % 40;
  const angle = (spread / 40) * Math.PI * 2;
  const radius = 0.12 + (spread % 8) * 0.03;
  return [base[0] + Math.sin(angle) * radius, base[1] + Math.cos(angle) * radius];
}

function gsaCoords(state: string, index: number): [number, number] {
  const base = GSA_STATE_COORDS[state] ?? [39.8283, -98.5795];
  const angle = (index % 12) * ((Math.PI * 2) / 12);
  return [base[0] + Math.sin(angle) * 0.2, base[1] + Math.cos(angle) * 0.2];
}

function gsaDispositionCoords(id: string, state: string, index: number): [number, number] {
  const base = GSA_STATE_COORDS[state] ?? [39.8283, -98.5795];
  const spread = hashString(id) % 40;
  const angle = (spread / 40) * Math.PI * 2;
  const radius = 0.15 + (index % 7) * 0.04;
  return [base[0] + Math.sin(angle) * radius, base[1] + Math.cos(angle) * radius];
}

function metaString(row: DatabaseListingRow, key: string): string {
  const value = row.metadata?.[key];
  return typeof value === "string" ? value : "";
}

function metaBool(row: DatabaseListingRow, key: string): boolean {
  return row.metadata?.[key] === true;
}

function displayImage(imageUrl: string | null): string {
  return imageUrl ?? DEFAULT_AUCTION_PROPERTY_IMAGE;
}

async function fetchAllRows(
  sourceId: string,
  options?: { includeInactive?: boolean },
): Promise<DatabaseListingRow[]> {
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

async function fetchSourceMeta(sourceId: string): Promise<{ scrapedAt: string; sourceUrl: string }> {
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
    imageUrl: row.image_url,
    displayImageUrl: displayImage(row.image_url),
    detailUrl: row.detail_url ?? "",
    sourceUrl: metaString(row, "sourceUrl"),
    sourceAgency: row.source_agency ?? "HUD",
  };
}

function rowToVrmListing(row: DatabaseListingRow): VrmListing {
  const [lat, lng] = row.lat != null && row.lng != null ? [row.lat, row.lng] : vrmCoords(row.id, row.state);
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
    imageUrl: row.image_url,
    displayImageUrl: displayImage(row.image_url),
    detailUrl: row.detail_url ?? "",
    sourceUrl: metaString(row, "sourceUrl"),
    sourceAgency: row.source_agency ?? "VRM Properties",
    lat,
    lng,
  };
}

function rowToHomeStepsListing(row: DatabaseListingRow): HomeStepsListing {
  return {
    id: row.id,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    listPrice: Number(row.price) || 0,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    imageUrl: row.image_url,
    displayImageUrl: displayImage(row.image_url),
    detailUrl: row.detail_url ?? "",
    sourceUrl: metaString(row, "sourceUrl"),
    sourceAgency: row.source_agency ?? "Freddie Mac HomeSteps",
    searchState: metaString(row, "searchState") || row.state,
  };
}

function rowToGsaSale(row: DatabaseListingRow, index: number): GsaRealEstateSale {
  const [lat, lng] = row.lat != null && row.lng != null ? [row.lat, row.lng] : gsaCoords(row.state, index);
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
    imageUrl: row.image_url,
    displayImageUrl: displayImage(row.image_url),
    detailUrl: row.detail_url ?? "",
    sourceUrl: metaString(row, "sourceUrl"),
    sourceAgency: row.source_agency ?? "GSA",
    lat,
    lng,
  };
}

function rowToGsaDisposition(row: DatabaseListingRow, index: number): GsaDispositionListing {
  const [lat, lng] =
    row.lat != null && row.lng != null ? [row.lat, row.lng] : gsaDispositionCoords(row.id, row.state, index);
  const status = row.status === "UNDER CONTRACT" || row.status === "SOLD" ? row.status : "Available";
  const rentableSqFt = Number(row.metadata?.rentableSqFt) || row.square_footage || 0;

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
    imageUrl: row.image_url,
    imageNote: metaString(row, "imageNote") || undefined,
    lat,
    lng,
    displayImageUrl: displayImage(row.image_url),
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
    imageUrl: h.displayImageUrl,
    detailPath: hudDetailPath(h.caseNumber),
    lat: h.lat,
    lng: h.lng,
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
    imageUrl: l.displayImageUrl,
    detailPath: "/property/detail/v1",
    lat: l.lat,
    lng: l.lng,
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
    imageUrl: l.displayImageUrl,
    detailPath: "/property/detail/v1",
    lat: l.lat,
    lng: l.lng,
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
    imageUrl: l.displayImageUrl,
    detailPath: "/property/detail/v1",
    lat: l.lat,
    lng: l.lng,
    isNew: false,
    subtitle: l.title,
  };
}

function mockToListing(
  mock: ReturnType<typeof generateAuctionProperties>[number],
  categoryLabel: string,
): PropertyListing {
  return {
    id: mock.id,
    address: mock.address,
    city: mock.city,
    state: mock.state,
    zip: mock.zip,
    price: mock.openingBid,
    priceLabel: "Est. Opening Bid",
    bedrooms: mock.beds,
    bathrooms: mock.baths,
    squareFootage: mock.sqft,
    propertyType: categoryLabel,
    status: mock.status,
    tags: mock.tags,
    imageUrl: mock.imageUrl,
    detailPath: "/property/detail/v1",
    lat: mock.lat,
    lng: mock.lng,
    isNew: mock.isNew,
  };
}

function loadMock(categoryKey: PropertyCategoryKey, buyType: BuyCategoryKey, count: number) {
  const config = PROPERTY_CATEGORIES[categoryKey];
  const mocks = generateAuctionProperties(buyType, count);
  return mocks.map((m) => mockToListing(m, config.title));
}

export async function fetchHudListingsDataset(): Promise<HudListingsDataset> {
  if (!isSupabaseConfigured()) return loadHudListings();

  const rows = await fetchAllRows("hud");
  if (!rows.length) return loadHudListings();

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
  if (!isSupabaseConfigured()) {
    const { getHudListingByCaseNumber } = await import("@/lib/hud-listings");
    return getHudListingByCaseNumber(caseNumber);
  }

  const client = createSupabaseServerClient();
  if (!client) return null;

  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("source_id", "hud")
    .eq("is_active", true)
    .eq("external_id", caseNumber)
    .maybeSingle();

  if (error || !data) {
    const { getHudListingByCaseNumber } = await import("@/lib/hud-listings");
    return getHudListingByCaseNumber(caseNumber);
  }

  return rowToHudListing(data as DatabaseListingRow);
}

export async function fetchAllHudCaseNumbers(): Promise<string[]> {
  const dataset = await fetchHudListingsDataset();
  return dataset.listings.map((l) => l.caseNumber);
}

export async function fetchVrmListingsDataset(): Promise<VrmListingsDataset> {
  if (!isSupabaseConfigured()) return loadVrmListings();

  const rows = await fetchAllRows("vrm");
  if (!rows.length) return loadVrmListings();

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
  if (!isSupabaseConfigured()) return loadHomeStepsListings();

  const rows = await fetchAllRows("homesteps");
  if (!rows.length) return loadHomeStepsListings();

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
  if (!isSupabaseConfigured()) return loadGsaRealEstateSales();

  const rows = await fetchAllRows("gsa-sales");
  if (!rows.length) return loadGsaRealEstateSales();

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
  if (!isSupabaseConfigured()) return loadGsaDispositions();

  const rows = await fetchAllRows("gsa-dispositions", { includeInactive: true });
  if (!rows.length) return loadGsaDispositions();

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

export async function fetchCategoryListings(categoryKey: PropertyCategoryKey): Promise<PropertyListing[]> {
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
      const mock = loadMock("bank-owned", "bank-owned", 24);
      return [...vrm.listings.map(vrmToPropertyListing), ...homesteps.listings.map(homestepsToPropertyListing), ...mock].sort(
        (a, b) => b.price - a.price,
      );
    }

    case "auction-property": {
      const gsa = await fetchGsaRealEstateSalesDataset();
      const mock = loadMock("auction-property", "commercial", 24);
      return [...gsa.listings.map(gsaSaleToPropertyListing), ...mock];
    }

    case "motivated-seller":
      return loadMock("motivated-seller", "non-bank-owned", 48);

    case "off-market":
      return loadMock("off-market", "short-sale", 48);

    case "foreclosure":
      return loadMock("foreclosure", "foreclosure-homes", 48);

    case "pre-foreclosure":
      return loadMock("pre-foreclosure", "second-chance-foreclosure", 48);

    case "sheriffs-sale":
      return loadMock("sheriffs-sale", "foreclosure-homes", 48).map((l) => ({
        ...l,
        tags: [...l.tags, "Sheriff's Sale"],
        propertyType: "Sheriff's Sale",
      }));

    case "tax-delinquent":
      return loadMock("tax-delinquent", "short-sale", 48).map((l) => ({
        ...l,
        tags: [...l.tags, "Tax Delinquent"],
        propertyType: "Tax Delinquent",
      }));

    default:
      return [];
  }
}
