import { ListingDetailContent } from "@/components/properties/ListingDetailContent";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import type { PropertyListing } from "@/lib/load-category-listings";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import { isListingFavorited } from "@/lib/member/favorites";
import {
  propertyListingToProtyDetail,
  redactProtyListingDetail,
} from "@/lib/proty-listing-detail";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { resolveListingAccess, toListingUnlockId } from "@/lib/unlocks/entitlements";

type ListingDetailPageShellProps = {
  listing: PropertyListing;
  categoryLabel: string;
  backHref: string;
  scrapedAt?: string;
  sourceAgency?: string;
  bodyClass?: string;
};

export async function ListingDetailPageShell({
  listing,
  categoryLabel,
  backHref,
  scrapedAt,
  sourceAgency,
  bodyClass = "theme-color-4 listing-detail-route reovana-listing-detail-route",
}: ListingDetailPageShellProps) {
  const home = loadTemplatePageBySlug("index");
  const chrome = home
    ? extractTemplateChrome(home.html)
    : { headerHtml: "", footerHtml: "", tailHtml: "" };

  const user = await getAuthUser();
  const unlockId = toListingUnlockId(listing.id);
  const [access, initialFavorited] = await Promise.all([
    resolveListingAccess(user, unlockId),
    user ? isListingFavorited(unlockId) : Promise.resolve(false),
  ]);
  const fullModel = propertyListingToProtyDetail(
    listing,
    categoryLabel,
    backHref,
    scrapedAt,
    sourceAgency,
  );
  const model = access.unlocked ? fullModel : redactProtyListingDetail(fullModel);

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass={bodyClass}
    >
      <ListingDetailContent
        model={model}
        unlocked={access.unlocked}
        isAdminBypass={access.isAdminBypass}
        initialFavorited={initialFavorited}
      />
    </TemplateChrome>
  );
}
