import type { Metadata } from "next";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import { searchListings } from "@/lib/listings-repository";
import { PropertyCategoryExplorer } from "@/components/properties/PropertyCategoryExplorer";
import { normalizeStateQuery } from "@/lib/us-states";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Search — REOVANA",
};

function readParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = readParam(params, "q").trim();
  const state = normalizeStateQuery(readParam(params, "state"));
  const beds = Number(readParam(params, "beds")) || 0;
  const baths = Number(readParam(params, "baths")) || 0;
  const minPrice = Number(readParam(params, "minPrice")) || 0;
  const maxPrice = Number(readParam(params, "maxPrice")) || 0;

  const { listings, total } = await searchListings({
    q,
    state,
    beds,
    baths,
    minPrice,
    maxPrice,
    page: 1,
    pageSize: 250,
  });

  const home = loadTemplatePageBySlug("index");
  const chrome = home
    ? extractTemplateChrome(home.html)
    : { headerHtml: "", footerHtml: "", tailHtml: "" };

  const title = q ? `Search: ${q}` : "Search Results";
  const descriptionParts = [
    state ? `State: ${state}` : "",
    beds ? `Beds: ${beds}+` : "",
    baths ? `Baths: ${baths}+` : "",
    minPrice ? `Min $${minPrice.toLocaleString()}` : "",
    maxPrice ? `Max $${maxPrice.toLocaleString()}` : "",
  ].filter(Boolean);
  const description = descriptionParts.length
    ? descriptionParts.join(" · ")
    : "Browse distressed property listings based on your search.";

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass="theme-color-4 auctions-route"
    >
      <PropertyCategoryExplorer
        title={title}
        description={description}
        listings={listings}
        totalCount={total}
        emptyMessage="No properties match your search yet. Try a different city, state, or filter."
      />
    </TemplateChrome>
  );
}

