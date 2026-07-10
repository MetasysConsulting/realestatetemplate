import type { Metadata } from "next";
import { browseAreaLabel } from "@/lib/listing-browse-redact";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { resolveListingAccess, toListingUnlockId } from "@/lib/unlocks/entitlements";

type ListingMetadataInput = {
  listingId: string;
  address: string;
  city: string;
  state: string;
  /** Full unlocked description line (price / status already formatted). */
  unlockedDescription: string;
  kindLabel: string;
};

/** Detail-page metadata that hides street + price when the viewer is locked. */
export async function listingDetailMetadata(input: ListingMetadataInput): Promise<Metadata> {
  const user = await getAuthUser();
  const access = await resolveListingAccess(user, toListingUnlockId(input.listingId));

  if (!access.unlocked) {
    const area = browseAreaLabel(input.city, input.state);
    return {
      title: `${area} — REOVANA`,
      description: `Locked ${input.kindLabel} listing in ${area}. Unlock on REOVANA for full address and pricing.`,
    };
  }

  return {
    title: `${input.address}, ${input.city} ${input.state} — REOVANA`,
    description: input.unlockedDescription,
  };
}
