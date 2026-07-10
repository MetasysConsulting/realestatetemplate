import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingDetailPageShell } from "@/components/properties/ListingDetailPageShell";
import { formatHudPrice } from "@/lib/hud-listings";
import { listingDetailMetadata } from "@/lib/listing-page-metadata";
import {
  fetchGsaRealEstateSalesDataset,
  fetchPropertyListingById,
} from "@/lib/listings-repository";
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

  return listingDetailMetadata({
    listingId: listing.id,
    address: listing.address,
    city: listing.city,
    state: listing.state,
    kindLabel: "auction",
    unlockedDescription: `Auction property at ${listing.address}, ${listing.city}, ${listing.state}. ${listing.price > 0 ? formatHudPrice(listing.price) : listing.status}.`,
  });
}

export default async function AuctionPropertyDetailPage({ params }: PageProps) {
  const { listingId } = await params;
  const listing = await fetchPropertyListingById(listingIdFromSlug(listingId));

  if (!listing) {
    notFound();
  }

  const gsaMeta = await fetchGsaRealEstateSalesDataset();

  return (
    <ListingDetailPageShell
      listing={listing}
      categoryLabel="Auction Properties"
      backHref="/buy/auction-property"
      scrapedAt={gsaMeta.scrapedAt}
      sourceAgency="U.S. General Services Administration"
    />
  );
}
