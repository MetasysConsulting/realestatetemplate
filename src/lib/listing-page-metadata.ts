import type { Metadata } from "next";

type ListingMetadataInput = {
  listingId: string;
  address: string;
  city: string;
  state: string;
  /** Full public description line (price / status already formatted). */
  unlockedDescription: string;
  kindLabel: string;
};

/** Listing detail SEO — address and pricing are public; owner contact is member-only. */
export async function listingDetailMetadata(input: ListingMetadataInput): Promise<Metadata> {
  void input.listingId;
  void input.kindLabel;
  return {
    title: `${input.address}, ${input.city} ${input.state} — REOVANA`,
    description: input.unlockedDescription,
  };
}
