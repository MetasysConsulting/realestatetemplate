"use client";

import { ProtyPropertyDetail } from "@/components/properties/ProtyPropertyDetail";
import type { ProtyListingDetailModel } from "@/lib/proty-listing-detail";

type HudDetailContentProps = {
  model: ProtyListingDetailModel;
  paywallBypass?: boolean;
};

export function HudDetailContent({ model, paywallBypass = false }: HudDetailContentProps) {
  return <ProtyPropertyDetail model={model} paywallBypass={paywallBypass} />;
}
