import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuctionsExplorer } from "@/components/auctions/AuctionsExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import {
  BUY_CATEGORIES,
  BUY_CATEGORY_SLUGS,
  resolveBuyCategory,
} from "@/lib/buy-categories";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { generateAuctionProperties } from "@/lib/generate-auction-properties";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

type PageProps = {
  params: Promise<{ category?: string[] }>;
};

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{}, ...BUY_CATEGORY_SLUGS.map((slug) => ({ category: [slug] }))];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: segments } = await params;
  const config = resolveBuyCategory(segments);

  return {
    title: `${config.title} — REOVANA`,
    description: `Browse ${config.title.toLowerCase()} and auction properties across the United States.`,
  };
}

export default async function AuctionsCategoryPage({ params }: PageProps) {
  const { category: segments } = await params;
  const config = resolveBuyCategory(segments);

  if (segments?.length === 1 && !(segments[0] in BUY_CATEGORIES)) {
    notFound();
  }

  if (segments && segments.length > 1) {
    notFound();
  }

  const properties = generateAuctionProperties(config.buyType, 32);
  const home = loadTemplatePageBySlug("index");
  const chrome = home
    ? extractTemplateChrome(home.html)
    : { headerHtml: "", footerHtml: "", tailHtml: "" };

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass="theme-color-4 auctions-route"
    >
      <AuctionsExplorer
        pageTitle={config.title}
        categoryKey={config.buyType}
        properties={properties}
      />
    </TemplateChrome>
  );
}
