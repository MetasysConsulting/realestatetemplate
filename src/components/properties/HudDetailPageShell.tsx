import { HudDetailContent } from "@/components/properties/HudDetailContent";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { isAdminEmail } from "@/lib/admin/admin-allowlist";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import type { HudListing } from "@/lib/hud-listings";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import { hudListingToProtyDetail, redactProtyListingDetail } from "@/lib/proty-listing-detail";
import { getAuthUser } from "@/lib/supabase/auth-server";

type HudDetailPageShellProps = {
  listing: HudListing;
  scrapedAt: string;
};

export async function HudDetailPageShell({ listing, scrapedAt }: HudDetailPageShellProps) {
  const home = loadTemplatePageBySlug("index");
  const chrome = home
    ? extractTemplateChrome(home.html)
    : { headerHtml: "", footerHtml: "", tailHtml: "" };

  const user = await getAuthUser();
  const paywallBypass = isAdminEmail(user?.email);
  const fullModel = hudListingToProtyDetail(listing, scrapedAt);
  const model = paywallBypass ? fullModel : redactProtyListingDetail(fullModel);

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass="theme-color-4 listing-detail-route reovana-listing-detail-route"
    >
      <HudDetailContent model={model} paywallBypass={paywallBypass} />
    </TemplateChrome>
  );
}
