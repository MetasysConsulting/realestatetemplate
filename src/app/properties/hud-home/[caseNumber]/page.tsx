import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HudDetailPageShell } from "@/components/properties/HudDetailPageShell";
import {
  formatHudPrice,
  getAllHudCaseNumbers,
  getHudListingByCaseNumber,
  loadHudListings,
} from "@/lib/hud-listings";
import { hudCaseFromSlug, hudCaseSlug } from "@/lib/property-categories";

export const dynamic = "force-static";
export const dynamicParams = false;

type PageProps = {
  params: Promise<{ caseNumber: string }>;
};

export function generateStaticParams() {
  return getAllHudCaseNumbers().map((caseNumber) => ({
    caseNumber: hudCaseSlug(caseNumber),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { caseNumber } = await params;
  const listing = getHudListingByCaseNumber(hudCaseFromSlug(caseNumber));

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
  const listing = getHudListingByCaseNumber(hudCaseFromSlug(caseNumber));

  if (!listing) {
    notFound();
  }

  const dataset = loadHudListings();

  return <HudDetailPageShell listing={listing} scrapedAt={dataset.scrapedAt} />;
}
