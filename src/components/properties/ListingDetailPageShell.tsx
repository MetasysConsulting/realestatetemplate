import { ListingDetailContent } from "@/components/properties/ListingDetailContent";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import type { PropertyListing } from "@/lib/load-category-listings";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

type ListingDetailPageShellProps = {
  listing: PropertyListing;
  categoryLabel: string;
  backHref: string;
  scrapedAt?: string;
  sourceAgency?: string;
  bodyClass?: string;
};

export function ListingDetailPageShell({
  listing,
  categoryLabel,
  backHref,
  scrapedAt,
  sourceAgency,
  bodyClass = "theme-color-4 hud-detail-route",
}: ListingDetailPageShellProps) {
  const home = loadTemplatePageBySlug("index");
  const chrome = home
    ? extractTemplateChrome(home.html)
    : { headerHtml: "", footerHtml: "", tailHtml: "" };

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass={bodyClass}
    >
      <ListingDetailContent
        listing={listing}
        categoryLabel={categoryLabel}
        backHref={backHref}
        scrapedAt={scrapedAt}
        sourceAgency={sourceAgency}
      />
    </TemplateChrome>
  );
}
