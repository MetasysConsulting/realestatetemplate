import { GovernmentDispositionsExplorer } from "@/components/auctions/GovernmentDispositionsExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { loadGsaDispositions } from "@/lib/gsa-dispositions";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export function GovernmentDispositionsPageContent() {
  const dataset = loadGsaDispositions();
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
        listings={dataset.listings}
        scrapedAt={dataset.scrapedAt}
        sourceUrl={dataset.sourceUrl}
      />
    </TemplateChrome>
  );
}
