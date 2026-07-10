"use client";

import { ProtyPropertyDetail } from "@/components/properties/ProtyPropertyDetail";
import type { ProtyListingDetailModel } from "@/lib/proty-listing-detail";

type HudDetailContentProps = {
  model: ProtyListingDetailModel;
  unlocked?: boolean;
  isAdminBypass?: boolean;
};

export function HudDetailContent({
  model,
  unlocked = false,
  isAdminBypass = false,
}: HudDetailContentProps) {
  return (
    <ProtyPropertyDetail model={model} unlocked={unlocked} isAdminBypass={isAdminBypass} />
  );
}
