import { HomeStepsExplorer } from "@/components/auctions/HomeStepsExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { fetchHomeStepsListingsDataset } from "@/lib/listings-repository";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export async function HomeStepsPageContent() {
  const dataset = await fetchHomeStepsListingsDataset();
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
      <HomeStepsExplorer
        listings={dataset.listings}
        scrapedAt={dataset.scrapedAt}
        sourceUrl={dataset.sourceUrl}
      />
    </TemplateChrome>
  );
}
