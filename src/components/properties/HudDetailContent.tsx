"use client";

import { ProtyPropertyDetail } from "@/components/properties/ProtyPropertyDetail";
import type { ProtyListingDetailModel } from "@/lib/proty-listing-detail";

type HudDetailContentProps = {
  model: ProtyListingDetailModel;
  unlocked?: boolean;
  isAdminBypass?: boolean;
  initialFavorited?: boolean;
};

export function HudDetailContent({
  model,
  unlocked = false,
  isAdminBypass = false,
  initialFavorited = false,
}: HudDetailContentProps) {
  return (
    <ProtyPropertyDetail
      model={model}
      unlocked={unlocked}
      isAdminBypass={isAdminBypass}
      initialFavorited={initialFavorited}
    />
  );
}
