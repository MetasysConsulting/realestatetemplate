"use client";

import { ProtyPropertyDetail } from "@/components/properties/ProtyPropertyDetail";
import { propertyListingToProtyDetail } from "@/lib/proty-listing-detail";
import type { PropertyListing } from "@/lib/load-category-listings";

type ListingDetailContentProps = {
  listing: PropertyListing;
  categoryLabel: string;
  backHref: string;
  scrapedAt?: string;
  sourceAgency?: string;
};

export function ListingDetailContent({
  listing,
  categoryLabel,
  backHref,
  scrapedAt,
  sourceAgency,
}: ListingDetailContentProps) {
  const model = propertyListingToProtyDetail(
    listing,
    categoryLabel,
    backHref,
    scrapedAt,
    sourceAgency,
  );

  return <ProtyPropertyDetail model={model} />;
}
