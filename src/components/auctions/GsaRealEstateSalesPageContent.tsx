import { GsaRealEstateSalesExplorer } from "@/components/auctions/GsaRealEstateSalesExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { fetchGsaRealEstateSalesDataset } from "@/lib/listings-repository";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export async function GsaRealEstateSalesPageContent() {
  const dataset = await fetchGsaRealEstateSalesDataset();
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
      <GsaRealEstateSalesExplorer
        listings={dataset.listings}
        scrapedAt={dataset.scrapedAt}
        sourceUrl={dataset.sourceUrl}
      />
    </TemplateChrome>
  );
}
