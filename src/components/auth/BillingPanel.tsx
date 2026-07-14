import Link from "next/link";
import { ManageBillingButton } from "@/components/auth/ManageBillingButton";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { listMyListingUnlocks } from "@/lib/unlocks/entitlements";
import {
  getMyStripeMembership,
  isMembershipStatusActive,
  resolveStripeCustomerIdForUser,
} from "@/lib/unlocks/membership";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past due";
    case "canceled":
    case "cancelled":
      return "Canceled";
    case "unpaid":
      return "Unpaid";
    default:
      return status.replace(/_/g, " ");
  }
}

export async function BillingPanel() {
  const user = await getAuthUser();
  if (!user) {
    return (
      <div className="widget-box-2 reovana-account-settings reovana-billing">
        <div className="box">
          <h3 className="title">Billing</h3>
          <p className="body-1 reovana-account-settings__intro">
            Sign in to view your REOVANA plan and manage billing in Stripe.
          </p>
          <a href="#modalLogin" className="tf-btn bg-color-primary pd-20" data-bs-toggle="modal">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  const [membership, unlocks, customerId] = await Promise.all([
    getMyStripeMembership(),
    listMyListingUnlocks(),
    resolveStripeCustomerIdForUser(user.id),
  ]);

  const active = membership
    ? isMembershipStatusActive(membership.status, membership.currentPeriodEnd)
    : false;
  const periodEnd = formatDate(membership?.currentPeriodEnd ?? null);
  const oneTimeCount = unlocks.filter((row) => row.source === "stripe_one_time").length;

  return (
    <div className="reovana-account-page__stack">
      <div className="widget-box-2 reovana-account-settings reovana-billing">
        <div className="box">
          <div className="reovana-billing__header">
            <div>
              <h3 className="title">Your plan</h3>
              <p className="body-1 reovana-account-settings__intro">
                Subscription and billing are handled securely by Stripe. Cancel or update your
                payment method anytime.
              </p>
            </div>
          </div>

          <div className="reovana-billing__plan">
            <div className="reovana-billing__plan-main">
              <p className="reovana-billing__plan-name">
                {active ? "Unlimited Access" : "No active subscription"}
              </p>
              <p className="reovana-billing__plan-detail">
                {active
                  ? "Unlock every listing while your plan is active."
                  : "You're on pay-per-listing. Subscribe anytime from a locked listing page."}
              </p>
            </div>
            {membership ? (
              <span
                className={`reovana-billing__status ${
                  active ? "reovana-billing__status--active" : "reovana-billing__status--inactive"
                }`}
              >
                {statusLabel(membership.status)}
              </span>
            ) : (
              <span className="reovana-billing__status reovana-billing__status--inactive">
                None
              </span>
            )}
          </div>

          <dl className="reovana-billing__facts">
            {periodEnd ? (
              <div>
                <dt>
                  {membership?.cancelAtPeriodEnd ? "Access through" : "Renews / period ends"}
                </dt>
                <dd>{periodEnd}</dd>
              </div>
            ) : null}
            {membership?.cancelAtPeriodEnd && active ? (
              <div>
                <dt>Cancellation</dt>
                <dd>Scheduled — you'll keep access until the period ends</dd>
              </div>
            ) : null}
            <div>
              <dt>One-time unlocks</dt>
              <dd>
                {oneTimeCount} {oneTimeCount === 1 ? "listing" : "listings"}
              </dd>
            </div>
            <div>
              <dt>Unlocked listings</dt>
              <dd>
                {unlocks.length} total ·{" "}
                <Link href="/my-profile#my-unlocks">View list</Link>
              </dd>
            </div>
          </dl>

          {customerId ? (
            <div className="reovana-billing__actions">
              <ManageBillingButton>
                {active ? "Manage or cancel in Stripe" : "Open Stripe billing"}
              </ManageBillingButton>
              <p className="reovana-billing__footnote">
                You'll leave REOVANA briefly and return here after you're done in Stripe.
              </p>
            </div>
          ) : (
            <p className="reovana-billing__footnote">
              After your first Stripe purchase, a Manage billing button will appear here so you
              can cancel or update payment methods.
            </p>
          )}
        </div>
      </div>

      <div className="widget-box-2 reovana-account-settings">
        <div className="box">
          <h3 className="title">Need profile settings?</h3>
          <p className="body-1 reovana-account-settings__intro">
            Update your name and see unlocked listings on Account settings.
          </p>
          <Link href="/my-profile" className="tf-btn style-border pd-20">
            Go to account settings
          </Link>
        </div>
      </div>
    </div>
  );
}
