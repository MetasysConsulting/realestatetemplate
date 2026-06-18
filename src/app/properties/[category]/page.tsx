import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyCategoryPageContent } from "@/components/properties/PropertyCategoryPageContent";
import {
  PROPERTY_CATEGORIES,
  PROPERTY_CATEGORY_NAV_SLUGS,
  type PropertyCategoryKey,
} from "@/lib/property-categories";

export const revalidate = 3600;
export const dynamicParams = false;

type PageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return PROPERTY_CATEGORY_NAV_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const key = category as PropertyCategoryKey;

  if (!(key in PROPERTY_CATEGORIES) || key === "hud-home") {
    return { title: "REOVANA" };
  }

  const config = PROPERTY_CATEGORIES[key];
  return {
    title: `${config.title} — REOVANA`,
    description: config.description,
  };
}

export default async function PropertyCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const key = category as PropertyCategoryKey;

  if (!(key in PROPERTY_CATEGORIES) || key === "hud-home") {
    notFound();
  }

  return <PropertyCategoryPageContent categoryKey={key} />;
}
