import { AuctionsExplorer } from "@/components/auctions/AuctionsExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import type { BuyCategoryKey } from "@/lib/buy-categories";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import {
  maybeRedactAuctionProperties,
} from "@/lib/listing-browse-redact";
import { shouldRevealBrowseDetails } from "@/lib/listing-browse-access";
import { fetchAuctionProperties } from "@/lib/listings-repository";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import { BUY_CATEGORIES } from "@/lib/buy-categories";

type AuctionsPageContentProps = {
  categoryKey: BuyCategoryKey;
};

export async function AuctionsPageContent({ categoryKey }: AuctionsPageContentProps) {
  const config = BUY_CATEGORIES[categoryKey];
  const reveal = await shouldRevealBrowseDetails();
  const properties = maybeRedactAuctionProperties(
    await fetchAuctionProperties(categoryKey),
    reveal,
  );
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
      <AuctionsExplorer
        pageTitle={config.title}
        categoryKey={categoryKey}
        properties={properties}
      />
    </TemplateChrome>
  );
}
