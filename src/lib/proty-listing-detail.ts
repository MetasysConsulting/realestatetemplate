import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import { formatHudPrice, formatHudScrapedDate } from "@/lib/hud-listings";
import { hasListingImage } from "@/lib/listing-images";
import type { PropertyListing } from "@/lib/load-category-listings";
import type { HudListing } from "@/lib/hud-listings";
import { hudDetailPath } from "@/lib/property-categories";

export type ProtyListingDetailModel = {
  id: string;
  listingId: string;
  categoryLabel: string;
  backHref: string;
  backLabel: string;
  title: string;
  priceDisplay: string;
  priceSuffix?: string;
  priceLabel: string;
  locationLine: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  propertyType: string;
  status: string;
  yearBuilt?: string | null;
  lotSize?: number | null;
  imageUrl: string;
  galleryImages: string[];
  lat: number;
  lng: number;
  hasRealCoordinates: boolean;
  detailPath: string;
  description: string;
  detailFacts: { label: string; value: string }[];
  amenities: string[];
  mapAddress: string;
  mapCity: string;
  mapState: string;
  mapZip: string;
  mapCounty?: string;
  disclaimer?: string;
  recentlyViewed: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    price: number;
    priceLabel: string;
    imageUrl: string;
    detailPath: string;
  };
};

function resolveGalleryImages(...urls: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    if (!hasListingImage(url)) continue;
    const trimmed = url!.trim();
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  if (!result.length) return [];
  return result.slice(0, 5);
}

function buildAmenities(tags: string[]): string[] {
  return tags.filter(Boolean).slice(0, 12);
}

function formatSqFt(value: number | null | undefined): string {
  if (!value || value <= 0) return "—";
  return `${value.toLocaleString()} SqFt`;
}

function formatRooms(value: number): string {
  if (value <= 0) return "—";
  return `${value} ${value === 1 ? "Room" : "Rooms"}`;
}

function resolveListingId(listing: PropertyListing): string {
  if (listing.radarId) return listing.radarId;
  const stripped = listing.id.replace(/^propertyradar-/, "");
  return stripped.length > 12 ? stripped.slice(0, 12) : stripped;
}

export function propertyListingToProtyDetail(
  listing: PropertyListing,
  categoryLabel: string,
  backHref: string,
  scrapedAt?: string,
  sourceAgency?: string,
): ProtyListingDetailModel {
  const priceDisplay =
    listing.price > 0
      ? formatHudPrice(listing.price)
      : listing.status === "Coming Soon"
        ? "Coming Soon"
        : "Contact for price";

  const detailFacts: { label: string; value: string }[] = [
    { label: "Property Type", value: listing.propertyType || "—" },
    { label: "Status", value: listing.status || "Active" },
  ];

  if (listing.subtitle) detailFacts.unshift({ label: "Listing", value: listing.subtitle });
  if (listing.yearBuilt) detailFacts.push({ label: "Year Built", value: listing.yearBuilt });
  if (listing.lotSize) detailFacts.push({ label: "Land Size", value: formatSqFt(listing.lotSize) });
  if (sourceAgency) detailFacts.push({ label: "Source Agency", value: sourceAgency });
  if (listing.tags.length) detailFacts.push({ label: "Tags", value: listing.tags.join(", ") });

  return {
    id: listing.id,
    listingId: resolveListingId(listing),
    categoryLabel,
    backHref,
    backLabel: categoryLabel,
    title: listing.address,
    priceDisplay,
    priceLabel: listing.priceLabel,
    locationLine: `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    squareFootage: listing.squareFootage,
    propertyType: listing.propertyType || "Residential",
    status: listing.status || "Active",
    yearBuilt: listing.yearBuilt,
    lotSize: listing.lotSize,
    imageUrl: hasListingImage(listing.imageUrl) ? listing.imageUrl!.trim() : DEFAULT_AUCTION_PROPERTY_IMAGE,
    galleryImages: resolveGalleryImages(listing.imageUrl),
    lat: listing.lat,
    lng: listing.lng,
    hasRealCoordinates: listing.hasRealCoordinates,
    detailPath: listing.detailPath,
    description: `${categoryLabel} opportunity at ${listing.address} in ${listing.city}, ${listing.state}. ${listing.priceLabel}: ${priceDisplay}. Browse distressed inventory on REOVANA and register interest to connect with our team.`,
    detailFacts,
    amenities: buildAmenities(listing.tags),
    mapAddress: listing.address,
    mapCity: listing.city,
    mapState: listing.state,
    mapZip: listing.zip,
    disclaimer: scrapedAt
      ? `Listing data last updated ${formatHudScrapedDate(scrapedAt)}. REOVANA hosts this inventory for your convenience.`
      : undefined,
    recentlyViewed: {
      id: listing.id,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip: listing.zip,
      price: listing.price,
      priceLabel: listing.priceLabel,
      imageUrl: listing.imageUrl ?? "",
      detailPath: listing.detailPath,
    },
  };
}

/** Strip sensitive listing fields for non-admin / unpaid viewers. */
export function redactProtyListingDetail(model: ProtyListingDetailModel): ProtyListingDetailModel {
  const cityState = [model.mapCity, model.mapState].filter(Boolean).join(", ");
  const areaLabel = cityState ? `${cityState} area` : "Listing area";

  return {
    ...model,
    title: "Address locked",
    priceDisplay: "••••••",
    priceSuffix: undefined,
    locationLine: `${areaLabel} — unlock for full address`,
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    yearBuilt: null,
    lotSize: null,
    listingId: "••••",
    propertyType: "—",
    status: "—",
    description:
      "Full pricing, address, specs, and seller contact are locked. Unlock this listing to view complete details.",
    detailFacts: model.detailFacts.map((fact) => ({
      label: fact.label,
      value: "—",
    })),
    amenities: [],
    mapAddress: areaLabel,
    mapZip: "",
    mapCounty: undefined,
    hasRealCoordinates: false,
    lat: 0,
    lng: 0,
    disclaimer: model.disclaimer
      ? "Unlock this listing to view source and update details."
      : undefined,
    recentlyViewed: {
      ...model.recentlyViewed,
      address: "Address locked",
      zip: "",
      price: 0,
    },
  };
}

export function hudListingToProtyDetail(listing: HudListing, scrapedAt: string): ProtyListingDetailModel {
  const priceDisplay = formatHudPrice(listing.listPrice);
  const unlockId = listing.id || `hud-${listing.caseNumber}`;

  return {
    id: unlockId,
    listingId: listing.caseNumber,
    categoryLabel: "HUD Home",
    backHref: "/buy/hud-home",
    backLabel: "HUD Homes",
    title: listing.address,
    priceDisplay,
    priceLabel: "List Price",
    locationLine: `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    squareFootage: listing.squareFootage,
    propertyType: listing.propertyType || "Residential",
    status: listing.propertyStatus || "Active",
    yearBuilt: null,
    lotSize: null,
    imageUrl: hasListingImage(listing.imageUrl)
      ? listing.imageUrl!.trim()
      : listing.displayImageUrl?.trim() || DEFAULT_AUCTION_PROPERTY_IMAGE,
    galleryImages: resolveGalleryImages(listing.imageUrl, listing.displayImageUrl),
    lat: listing.lat,
    lng: listing.lng,
    hasRealCoordinates: listing.hasRealCoordinates,
    detailPath: hudDetailPath(listing.caseNumber),
    description: `HUD home at ${listing.address} in ${listing.city}, ${listing.state}. List price ${priceDisplay}. Listing period ${listing.listingPeriod || "—"}. Register interest through REOVANA and work with a HUD-registered broker to place a bid.`,
    detailFacts: [
      { label: "Case Number", value: listing.caseNumber },
      { label: "Property Type", value: listing.propertyType || "—" },
      { label: "County", value: listing.county || "—" },
      { label: "Listing Period", value: listing.listingPeriod || "—" },
      { label: "Status", value: listing.propertyStatus || "Active" },
      { label: "Bid Opens", value: listing.bidOpenDate || "TBD" },
      { label: "Bid Deadline", value: listing.periodDeadlineDate || "—" },
      { label: "FHA Financing", value: listing.fhaFinancing || "—" },
      { label: "Eligible Bidders", value: listing.eligibleBidders || "—" },
    ],
    amenities: buildAmenities(["HUD Home", "Government owned"]),
    mapAddress: listing.address,
    mapCity: listing.city,
    mapState: listing.state,
    mapZip: listing.zip,
    mapCounty: listing.county,
    disclaimer: `Listing data last updated ${formatHudScrapedDate(scrapedAt)}. Bids on HUD homes require a HUD-registered broker. REOVANA hosts this inventory for your convenience.`,
    recentlyViewed: {
      id: unlockId,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip: listing.zip,
      price: listing.listPrice,
      priceLabel: "List Price",
      imageUrl: listing.displayImageUrl ?? listing.imageUrl ?? "",
      detailPath: hudDetailPath(listing.caseNumber),
    },
  };
}
