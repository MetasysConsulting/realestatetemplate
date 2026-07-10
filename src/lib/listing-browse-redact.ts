import type { AuctionProperty } from "@/lib/generate-auction-properties";
import type { GsaDispositionListing } from "@/lib/gsa-dispositions";
import type { GsaRealEstateSale } from "@/lib/gsa-realestatesales";
import type { HomeStepsListing } from "@/lib/homesteps-listings";
import type { HudListing } from "@/lib/hud-listings";
import type { PropertyListing } from "@/lib/load-category-listings";
import type { VrmListing } from "@/lib/vrm-listings";

export const BROWSE_LOCKED_PRICE_DISPLAY = "••••••";
export const BROWSE_LOCKED_PRICE_LABEL = "Unlock to view";

type Locatable = {
  address: string;
  city: string;
  state: string;
  zip: string;
};

export function browseAreaLabel(city: string, state: string): string {
  const cityState = [city, state].filter(Boolean).join(", ");
  return cityState ? `${cityState} area` : "Listing area";
}

export function formatCardLocation(listing: Locatable & { browseLocked?: boolean }): string {
  if (listing.browseLocked) return listing.address;
  return [listing.address, listing.city, [listing.state, listing.zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
}

export function formatCardPrice(price: number, browseLocked?: boolean): string {
  if (browseLocked) return BROWSE_LOCKED_PRICE_DISPLAY;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function lockLocation<T extends Locatable>(item: T): T & { browseLocked: true } {
  return {
    ...item,
    address: browseAreaLabel(item.city, item.state),
    city: "",
    state: "",
    zip: "",
    browseLocked: true,
  };
}

export function redactPropertyListingForBrowse(listing: PropertyListing): PropertyListing {
  return {
    ...lockLocation(listing),
    price: 0,
    priceLabel: BROWSE_LOCKED_PRICE_LABEL,
  };
}

export function redactHudListingForBrowse(listing: HudListing): HudListing {
  return {
    ...lockLocation(listing),
    listPrice: 0,
  };
}

export function redactVrmListingForBrowse(listing: VrmListing): VrmListing {
  return {
    ...lockLocation(listing),
    listPrice: 0,
  };
}

export function redactHomeStepsListingForBrowse(listing: HomeStepsListing): HomeStepsListing {
  return {
    ...lockLocation(listing),
    listPrice: 0,
  };
}

export function redactGsaSaleForBrowse(listing: GsaRealEstateSale): GsaRealEstateSale {
  const locked = lockLocation(listing);
  return {
    ...locked,
    title: locked.address,
    startingBid: 0,
  };
}

export function redactGsaDispositionForBrowse(listing: GsaDispositionListing): GsaDispositionListing {
  const locked = lockLocation(listing);
  return {
    ...locked,
    title: locked.address,
  };
}

export function redactAuctionPropertyForBrowse(property: AuctionProperty): AuctionProperty {
  return {
    ...lockLocation(property),
    openingBid: 0,
    previousPrice: undefined,
  };
}

export function maybeRedactPropertyListings(
  listings: PropertyListing[],
  reveal: boolean,
): PropertyListing[] {
  return reveal ? listings : listings.map(redactPropertyListingForBrowse);
}

export function maybeRedactHudListings(listings: HudListing[], reveal: boolean): HudListing[] {
  return reveal ? listings : listings.map(redactHudListingForBrowse);
}

export function maybeRedactVrmListings(listings: VrmListing[], reveal: boolean): VrmListing[] {
  return reveal ? listings : listings.map(redactVrmListingForBrowse);
}

export function maybeRedactHomeStepsListings(
  listings: HomeStepsListing[],
  reveal: boolean,
): HomeStepsListing[] {
  return reveal ? listings : listings.map(redactHomeStepsListingForBrowse);
}

export function maybeRedactGsaSales(
  listings: GsaRealEstateSale[],
  reveal: boolean,
): GsaRealEstateSale[] {
  return reveal ? listings : listings.map(redactGsaSaleForBrowse);
}

export function maybeRedactGsaDispositions(
  listings: GsaDispositionListing[],
  reveal: boolean,
): GsaDispositionListing[] {
  return reveal ? listings : listings.map(redactGsaDispositionForBrowse);
}

export function maybeRedactAuctionProperties(
  properties: AuctionProperty[],
  reveal: boolean,
): AuctionProperty[] {
  return reveal ? properties : properties.map(redactAuctionPropertyForBrowse);
}

export function maybeRedactHomeCategoryRows(
  rows: Record<string, PropertyListing[]>,
  reveal: boolean,
): Record<string, PropertyListing[]> {
  if (reveal) return rows;
  const next: Record<string, PropertyListing[]> = {};
  for (const [key, listings] of Object.entries(rows)) {
    next[key] = listings.map(redactPropertyListingForBrowse);
  }
  return next;
}
