import type { Metadata } from "next";
import { MemberDashboardShell } from "@/components/member/MemberDashboardShell";
import { MemberSellerPropertiesList } from "@/components/member/MemberSellerPropertiesList";
import { SellerCheckoutConfirm } from "@/components/sell/SellerCheckoutConfirm";
import {
  getMySellerListingSubscription,
  listMySellerProperties,
} from "@/lib/seller/properties";
import { isMembershipStatusActive } from "@/lib/unlocks/membership";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "My Properties — REOVANA",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyPropertyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const checkoutError =
    typeof params.checkout_error === "string" ? params.checkout_error : null;
  const draftSaved = typeof params.draft === "string";

  const [properties, sellerSub] = await Promise.all([
    listMySellerProperties(),
    getMySellerListingSubscription(),
  ]);

  const hasActiveSellerSub = sellerSub
    ? isMembershipStatusActive(sellerSub.status, sellerSub.currentPeriodEnd)
    : false;

  return (
    <MemberDashboardShell
      activeHref="/my-property"
      title="My properties"
      subtitle="Seller listings you publish on REOVANA appear here."
    >
      <SellerCheckoutConfirm />
      <MemberSellerPropertiesList
        properties={properties}
        hasActiveSellerSub={hasActiveSellerSub}
        checkoutNotice={
          draftSaved
            ? "Listing draft saved. Activate with $49/month to publish."
            : null
        }
        checkoutError={checkoutError}
      />
    </MemberDashboardShell>
  );
}
