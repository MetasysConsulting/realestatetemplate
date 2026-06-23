import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HudDetailPageShell } from "@/components/properties/HudDetailPageShell";
import { formatHudPrice } from "@/lib/hud-listings";
import {
  fetchHudListingByCaseNumber,
  fetchHudListingsDataset,
} from "@/lib/listings-repository";
import { hudCaseFromSlug } from "@/lib/property-categories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ caseNumber: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { caseNumber } = await params;
  const listing = await fetchHudListingByCaseNumber(hudCaseFromSlug(caseNumber));

  if (!listing) {
    return { title: "REOVANA" };
  }

  return {
    title: `${listing.address}, ${listing.city} ${listing.state} — REOVANA`,
    description: `HUD home at ${listing.address}, ${listing.city}, ${listing.state}. List price ${formatHudPrice(listing.listPrice)}.`,
  };
}

export default async function HudHomeDetailPage({ params }: PageProps) {
  const { caseNumber } = await params;
  const listing = await fetchHudListingByCaseNumber(hudCaseFromSlug(caseNumber));

  if (!listing) {
    notFound();
  }

  const dataset = await fetchHudListingsDataset();

  return <HudDetailPageShell listing={listing} scrapedAt={dataset.scrapedAt} />;
}
