import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuctionsPageContent } from "@/components/auctions/AuctionsPageContent";
import {
  BUY_CATEGORIES,
  BUY_CATEGORY_SLUGS,
  type BuyCategoryKey,
} from "@/lib/buy-categories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = false;

type PageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return BUY_CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const key = category as BuyCategoryKey;

  if (!(key in BUY_CATEGORIES) || key === "all") {
    return { title: "REOVANA" };
  }

  const config = BUY_CATEGORIES[key];
  return {
    title: `${config.title} — REOVANA`,
    description: `Browse ${config.title.toLowerCase()} and auction properties across the United States.`,
  };
}

export default async function AuctionsCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const key = category as BuyCategoryKey;

  if (!(key in BUY_CATEGORIES) || key === "all") {
    notFound();
  }

  return <AuctionsPageContent categoryKey={key} />;
}
