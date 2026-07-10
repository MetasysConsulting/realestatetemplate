import type { Metadata } from "next";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import { searchListings } from "@/lib/listings-repository";
import {
  maybeRedactPropertyListings,
} from "@/lib/listing-browse-redact";
import { shouldRevealBrowseDetails } from "@/lib/listing-browse-access";
import { PropertyCategoryExplorer } from "@/components/properties/PropertyCategoryExplorer";
import { SearchPageForm } from "@/components/search/SearchPageForm";
import { SearchPager } from "@/components/search/SearchPager";
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
  const propertyType = readParam(params, "propertyType").trim();
  const beds = Number(readParam(params, "beds")) || 0;
  const baths = Number(readParam(params, "baths")) || 0;
  const minPrice = Number(readParam(params, "minPrice")) || 0;
  const maxPrice = Number(readParam(params, "maxPrice")) || 0;
  const page = Math.max(1, Number(readParam(params, "page")) || 1);
  const pageSize = Math.min(100, Math.max(20, Number(readParam(params, "pageSize")) || 40));

  const { listings, total } = await searchListings({
    q,
    state,
    propertyType,
    beds,
    baths,
    minPrice,
    maxPrice,
    page,
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

  const safeTotal = typeof total === "number" ? total : undefined;
  const totalPages = safeTotal ? Math.max(1, Math.ceil(safeTotal / pageSize)) : 1;
  const showPager = totalPages > 1;

  const buildHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (state) next.set("state", state);
    if (propertyType) next.set("propertyType", propertyType);
    if (beds) next.set("beds", String(beds));
    if (baths) next.set("baths", String(baths));
    if (minPrice) next.set("minPrice", String(minPrice));
    if (maxPrice) next.set("maxPrice", String(maxPrice));
    if (pageSize !== 40) next.set("pageSize", String(pageSize));
    if (nextPage > 1) next.set("page", String(nextPage));
    const qs = next.toString();
    return qs ? `/search?${qs}` : "/search";
  };

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass="theme-color-4 auctions-route"
    >
      <div className="reovana-search-page">
        <div className="reovana-search-page__chrome">
          <SearchPageForm
            q={q}
            state={state}
            propertyType={propertyType}
            beds={beds}
            baths={baths}
            minPrice={minPrice}
            maxPrice={maxPrice}
            pageSize={pageSize}
          />
        </div>

        <PropertyCategoryExplorer
          title={title}
          description={description}
          listings={gatedListings}
          totalCount={total}
          hideStateFilter
          emptyMessage="No properties match your search yet. Try a different city, state, or filter."
        />

        {showPager ? (
          <div className="reovana-search-page__chrome reovana-search-page__chrome--footer">
            <SearchPager page={page} totalPages={totalPages} buildHref={buildHref} />
          </div>
        ) : null}
      </div>
    </TemplateChrome>
  );
}
