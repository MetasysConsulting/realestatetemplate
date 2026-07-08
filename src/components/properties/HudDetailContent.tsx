"use client";

import { ProtyPropertyDetail } from "@/components/properties/ProtyPropertyDetail";
import { hudListingToProtyDetail } from "@/lib/proty-listing-detail";
import type { HudListing } from "@/lib/hud-listings";

type HudDetailContentProps = {
  listing: HudListing;
  scrapedAt: string;
};

export function HudDetailContent({ listing, scrapedAt }: HudDetailContentProps) {
  const model = hudListingToProtyDetail(listing, scrapedAt);
  return <ProtyPropertyDetail model={model} />;
}
