"use client";

import { ProtyPropertyDetail } from "@/components/properties/ProtyPropertyDetail";
import type { ProtyListingDetailModel } from "@/lib/proty-listing-detail";

type ListingDetailContentProps = {
  model: ProtyListingDetailModel;
  unlocked?: boolean;
  isAdminBypass?: boolean;
};

export function ListingDetailContent({
  model,
  unlocked = false,
  isAdminBypass = false,
}: ListingDetailContentProps) {
  return (
    <ProtyPropertyDetail model={model} unlocked={unlocked} isAdminBypass={isAdminBypass} />
  );
}
