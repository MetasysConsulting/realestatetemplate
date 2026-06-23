import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingDetailPageShell } from "@/components/properties/ListingDetailPageShell";
import { formatHudPrice } from "@/lib/hud-listings";
import { fetchPropertyListingById, fetchSourceMetaForPropertyRadar } from "@/lib/listings-repository";
import {
  listingIdFromSlug,
  PROPERTY_CATEGORIES,
  type PropertyCategoryKey,
} from "@/lib/property-categories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

const PROPERTY_RADAR_DETAIL_CATEGORIES = new Set<PropertyCategoryKey>([
  "motivated-seller",
  "off-market",
  "foreclosure",
  "pre-foreclosure",
]);

type PageProps = {
  params: Promise<{ category: string; listingId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, listingId } = await params;
  const categoryKey = category as PropertyCategoryKey;

  if (!PROPERTY_RADAR_DETAIL_CATEGORIES.has(categoryKey)) {
    return { title: "REOVANA" };
  }

  const listing = await fetchPropertyListingById(listingIdFromSlug(listingId));

  if (!listing) {
    return { title: "REOVANA" };
  }

  return {
    title: `${listing.address}, ${listing.city} ${listing.state} — REOVANA`,
    description: `${PROPERTY_CATEGORIES[categoryKey].title} at ${listing.address}, ${listing.city}, ${listing.state}. ${listing.price > 0 ? formatHudPrice(listing.price) : listing.status}.`,
  };
}

export default async function PropertyRadarDetailPage({ params }: PageProps) {
  const { category, listingId } = await params;
  const categoryKey = category as PropertyCategoryKey;

  if (!PROPERTY_RADAR_DETAIL_CATEGORIES.has(categoryKey)) {
    notFound();
  }

  const listing = await fetchPropertyListingById(listingIdFromSlug(listingId));

  if (!listing || !listing.detailPath.startsWith(`/properties/${categoryKey}/`)) {
    notFound();
  }

  const config = PROPERTY_CATEGORIES[categoryKey];
  const meta = await fetchSourceMetaForPropertyRadar();

  return (
    <ListingDetailPageShell
      listing={listing}
      categoryLabel={config.title}
      backHref={config.path}
      scrapedAt={meta.scrapedAt}
      sourceAgency="PropertyRadar"
    />
  );
}
