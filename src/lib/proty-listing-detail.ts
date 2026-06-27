import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import { formatHudPrice, formatHudScrapedDate } from "@/lib/hud-listings";
import { hasListingImage } from "@/lib/listing-images";
import type { PropertyListing } from "@/lib/load-category-listings";
import type { HudListing } from "@/lib/hud-listings";
import { hudDetailPath } from "@/lib/property-categories";

export type ProtyListingDetailModel = {
  id: string;
  categoryLabel: string;
  backHref: string;
  backLabel: string;
  title: string;
  priceDisplay: string;
  priceSuffix?: string;
  locationLine: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  propertyType: string;
  status: string;
  imageUrl: string;
  galleryImages: string[];
  lat: number;
  lng: number;
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

function resolveGalleryImages(imageUrl: string | null | undefined): string[] {
  const primary = hasListingImage(imageUrl) ? imageUrl!.trim() : DEFAULT_AUCTION_PROPERTY_IMAGE;
  return [primary];
}

function buildAmenities(tags: string[], categoryLabel: string): string[] {
  const fromTags = tags.filter(Boolean).slice(0, 8);
  if (fromTags.length >= 4) return fromTags;
  return [
    ...fromTags,
    categoryLabel,
    "Distressed opportunity",
    "Investor eligible",
    "REOVANA verified listing",
  ].slice(0, 8);
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
  if (sourceAgency) detailFacts.push({ label: "Source Agency", value: sourceAgency });
  if (listing.tags.length) detailFacts.push({ label: "Tags", value: listing.tags.join(", ") });

  return {
    id: listing.id,
    categoryLabel,
    backHref,
    backLabel: categoryLabel,
    title: listing.address,
    priceDisplay,
    locationLine: `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    squareFootage: listing.squareFootage,
    propertyType: listing.propertyType || "Residential",
    status: listing.status || "Active",
    imageUrl: hasListingImage(listing.imageUrl) ? listing.imageUrl!.trim() : DEFAULT_AUCTION_PROPERTY_IMAGE,
    galleryImages: resolveGalleryImages(listing.imageUrl),
    lat: listing.lat,
    lng: listing.lng,
    detailPath: listing.detailPath,
    description: `${categoryLabel} opportunity at ${listing.address} in ${listing.city}, ${listing.state}. ${listing.priceLabel}: ${priceDisplay}. Browse distressed inventory on REOVANA and register interest to connect with our team.`,
    detailFacts,
    amenities: buildAmenities(listing.tags, categoryLabel),
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

export function hudListingToProtyDetail(listing: HudListing, scrapedAt: string): ProtyListingDetailModel {
  const priceDisplay = formatHudPrice(listing.listPrice);

  return {
    id: `hud-${listing.caseNumber}`,
    categoryLabel: "HUD Home",
    backHref: "/buy/hud-home",
    backLabel: "HUD Homes",
    title: listing.address,
    priceDisplay,
    locationLine: `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    squareFootage: listing.squareFootage,
    propertyType: listing.propertyType || "Residential",
    status: listing.propertyStatus || "Active",
    imageUrl: hasListingImage(listing.imageUrl)
      ? listing.imageUrl!.trim()
      : listing.displayImageUrl?.trim() || DEFAULT_AUCTION_PROPERTY_IMAGE,
    galleryImages: resolveGalleryImages(listing.imageUrl ?? listing.displayImageUrl),
    lat: listing.lat,
    lng: listing.lng,
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
    amenities: buildAmenities(["HUD Home", "Government owned"], "HUD Home"),
    mapAddress: listing.address,
    mapCity: listing.city,
    mapState: listing.state,
    mapZip: listing.zip,
    mapCounty: listing.county,
    disclaimer: `Listing data last updated ${formatHudScrapedDate(scrapedAt)}. Bids on HUD homes require a HUD-registered broker. REOVANA hosts this inventory for your convenience.`,
    recentlyViewed: {
      id: `hud-${listing.caseNumber}`,
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
