import { HudDetailContent } from "@/components/properties/HudDetailContent";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import type { HudListing } from "@/lib/hud-listings";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

type HudDetailPageShellProps = {
  listing: HudListing;
  scrapedAt: string;
};

export function HudDetailPageShell({ listing, scrapedAt }: HudDetailPageShellProps) {
  const home = loadTemplatePageBySlug("index");
  const chrome = home
    ? extractTemplateChrome(home.html)
    : { headerHtml: "", footerHtml: "", tailHtml: "" };

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass="theme-color-4 hud-detail-route"
    >
      <HudDetailContent listing={listing} scrapedAt={scrapedAt} />
    </TemplateChrome>
  );
}
