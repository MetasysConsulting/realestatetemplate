import type { Metadata } from "next";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import { searchListings } from "@/lib/listings-repository";
import { maybeRedactPropertyListings } from "@/lib/listing-browse-redact";
import { shouldRevealBrowseDetails } from "@/lib/listing-browse-access";
import { HomesStyleSearchLayout } from "@/components/search/HomesStyleSearchLayout";
import { normalizeStateQuery } from "@/lib/us-states";
import { sanitizeChromeTailForSearch } from "@/lib/sanitize-chrome-tail";

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
  const propertyType = readParam(params, "propertyType").trim();
  const beds = Number(readParam(params, "beds")) || 0;
  const baths = Number(readParam(params, "baths")) || 0;
  const minPrice = Number(readParam(params, "minPrice")) || 0;
  const maxPrice = Number(readParam(params, "maxPrice")) || 0;
  const pageSize = Math.min(100, Math.max(20, Number(readParam(params, "pageSize")) || 40));

  // Always load first page for SSR; infinite scroll loads later pages client-side.
  const { listings, total } = await searchListings({
    q,
    state,
    propertyType,
    beds,
    baths,
    minPrice,
    maxPrice,
    page: 1,
    pageSize,
  });

  const reveal = await shouldRevealBrowseDetails();
  const gatedListings = maybeRedactPropertyListings(listings, reveal);

  const home = loadTemplatePageBySlug("index");
  const chrome = home
    ? extractTemplateChrome(home.html)
    : { headerHtml: "", footerHtml: "", tailHtml: "" };

  const title = q ? `Search: ${q}` : "Search Results";
  const descriptionParts = [
    state ? `State: ${state}` : "",
    propertyType ? `Type: ${propertyType}` : "",
    beds ? `Beds: ${beds}+` : "",
    baths ? `Baths: ${baths}+` : "",
    minPrice ? `Min $${minPrice.toLocaleString()}` : "",
    maxPrice ? `Max $${maxPrice.toLocaleString()}` : "",
  ].filter(Boolean);
  const description = descriptionParts.length
    ? descriptionParts.join(" · ")
    : "Browse distressed property listings based on your search.";

  const filterKey = [
    q,
    state,
    propertyType,
    beds,
    baths,
    minPrice,
    maxPrice,
    pageSize,
  ].join("|");

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml=""
      tailHtml={sanitizeChromeTailForSearch(chrome.tailHtml)}
      bodyClass="theme-color-4 auctions-route search-map-route"
    >
      <HomesStyleSearchLayout
        key={filterKey}
        title={title}
        description={description}
        filters={{
          q,
          state,
          propertyType,
          beds,
          baths,
          minPrice,
          maxPrice,
          pageSize,
        }}
        initialListings={gatedListings}
        totalCount={total}
        footerHtml={chrome.footerHtml}
        emptyMessage="No properties match your search yet. Try a different city, state, or filter."
      />
    </TemplateChrome>
  );
}
