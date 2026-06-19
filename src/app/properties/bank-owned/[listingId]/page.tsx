import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingDetailPageShell } from "@/components/properties/ListingDetailPageShell";
import { formatHudPrice } from "@/lib/hud-listings";
import { fetchPropertyListingById, fetchVrmListingsDataset } from "@/lib/listings-repository";
import { listingIdFromSlug } from "@/lib/property-categories";

export const revalidate = 3600;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { listingId } = await params;
  const listing = await fetchPropertyListingById(listingIdFromSlug(listingId));

  if (!listing) {
    return { title: "REOVANA" };
  }

  return {
    title: `${listing.address}, ${listing.city} ${listing.state} — REOVANA`,
    description: `Bank-owned property at ${listing.address}, ${listing.city}, ${listing.state}. ${listing.price > 0 ? formatHudPrice(listing.price) : listing.status}.`,
  };
}

export default async function BankOwnedDetailPage({ params }: PageProps) {
  const { listingId } = await params;
  const listing = await fetchPropertyListingById(listingIdFromSlug(listingId));

  if (!listing) {
    notFound();
  }

  const vrmMeta = await fetchVrmListingsDataset();
  const sourceAgency = listing.tags.includes("Freddie Mac")
    ? "Freddie Mac HomeSteps"
    : "VRM Properties (VA REO)";

  return (
    <ListingDetailPageShell
      listing={listing}
      categoryLabel="Bank Owned Properties"
      backHref="/properties/bank-owned"
      scrapedAt={vrmMeta.scrapedAt}
      sourceAgency={sourceAgency}
    />
  );
}
