import { AuctionsExplorer } from "@/components/auctions/AuctionsExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import type { BuyCategoryKey } from "@/lib/buy-categories";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { generateAuctionProperties } from "@/lib/generate-auction-properties";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import { BUY_CATEGORIES } from "@/lib/buy-categories";

type AuctionsPageContentProps = {
  categoryKey: BuyCategoryKey;
};

export function AuctionsPageContent({ categoryKey }: AuctionsPageContentProps) {
  const config = BUY_CATEGORIES[categoryKey];
  const properties = generateAuctionProperties(categoryKey, 48);
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
