import { VrmPropertiesExplorer } from "@/components/auctions/VrmPropertiesExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { fetchVrmListingsDataset } from "@/lib/listings-repository";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export async function VrmPropertiesPageContent() {
  const dataset = await fetchVrmListingsDataset();
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
      <VrmPropertiesExplorer
        listings={dataset.listings}
        scrapedAt={dataset.scrapedAt}
        sourceUrl={dataset.sourceUrl}
      />
    </TemplateChrome>
  );
}
