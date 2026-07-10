"use client";

import { ProtyPropertyDetail } from "@/components/properties/ProtyPropertyDetail";
import type { ProtyListingDetailModel } from "@/lib/proty-listing-detail";

type ListingDetailContentProps = {
  model: ProtyListingDetailModel;
  paywallBypass?: boolean;
};

export function ListingDetailContent({
  model,
  paywallBypass = false,
}: ListingDetailContentProps) {
  return <ProtyPropertyDetail model={model} paywallBypass={paywallBypass} />;
}
