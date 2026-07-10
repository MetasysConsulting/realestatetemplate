import { HudHomesExplorer } from "@/components/auctions/HudHomesExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import {
  maybeRedactHudListings,
} from "@/lib/listing-browse-redact";
import { shouldRevealBrowseDetails } from "@/lib/listing-browse-access";
import { fetchHudListingsDataset } from "@/lib/listings-repository";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export async function HudHomesPageContent() {
  const dataset = await fetchHudListingsDataset();
  const reveal = await shouldRevealBrowseDetails();
  const listings = maybeRedactHudListings(dataset.listings, reveal);
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
      <HudHomesExplorer listings={listings} scrapedAt={dataset.scrapedAt} />
    </TemplateChrome>
  );
}
