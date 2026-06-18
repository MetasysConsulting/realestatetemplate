import { HudHomesExplorer } from "@/components/auctions/HudHomesExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { fetchHudListingsDataset } from "@/lib/listings-repository";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export async function HudHomesPageContent() {
  const dataset = await fetchHudListingsDataset();
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
      <HudHomesExplorer listings={dataset.listings} scrapedAt={dataset.scrapedAt} />
    </TemplateChrome>
  );
}
