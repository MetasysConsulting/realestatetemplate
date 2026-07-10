import { GovernmentDispositionsExplorer } from "@/components/auctions/GovernmentDispositionsExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import {
  maybeRedactGsaDispositions,
} from "@/lib/listing-browse-redact";
import { shouldRevealBrowseDetails } from "@/lib/listing-browse-access";
import { fetchGsaDispositionsDataset } from "@/lib/listings-repository";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export async function GovernmentDispositionsPageContent() {
  const dataset = await fetchGsaDispositionsDataset();
  const reveal = await shouldRevealBrowseDetails();
  const listings = maybeRedactGsaDispositions(dataset.listings, reveal);
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
      <GovernmentDispositionsExplorer
        listings={listings}
        scrapedAt={dataset.scrapedAt}
        sourceUrl={dataset.sourceUrl}
      />
    </TemplateChrome>
  );
}
