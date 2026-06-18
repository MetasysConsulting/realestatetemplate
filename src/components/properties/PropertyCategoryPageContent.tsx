import { PropertyCategoryExplorer } from "@/components/properties/PropertyCategoryExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { fetchCategoryListings } from "@/lib/listings-repository";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import type { PropertyCategoryKey } from "@/lib/property-categories";
import { PROPERTY_CATEGORIES } from "@/lib/property-categories";

type PropertyCategoryPageContentProps = {
  categoryKey: PropertyCategoryKey;
};

export async function PropertyCategoryPageContent({ categoryKey }: PropertyCategoryPageContentProps) {
  const config = PROPERTY_CATEGORIES[categoryKey];
  const listings = await fetchCategoryListings(categoryKey);
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
      <PropertyCategoryExplorer
        title={config.title}
        description={config.description}
        listings={listings}
      />
    </TemplateChrome>
  );
}
