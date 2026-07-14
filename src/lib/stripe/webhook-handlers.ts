import "server-only";

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { grantListingUnlock } from "@/lib/unlocks/entitlements";
import { upsertStripeMembership } from "@/lib/unlocks/membership";

function meta(session: Stripe.Checkout.Session, key: string): string {
  return session.metadata?.[key]?.trim() || "";
}

function subscriptionPeriodEnd(sub: Stripe.Subscription): string | null {
  const end = (
    sub as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end;
  if (typeof end !== "number") return null;
  return new Date(end * 1000).toISOString();
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<{ ok: boolean; error?: string }> {
  const userId = meta(session, "userId") || session.client_reference_id?.trim() || "";
  const listingId = meta(session, "listingId");
  const plan = meta(session, "plan") || (session.mode === "subscription" ? "unlimited" : "unlock");

  if (!userId) {
    console.error("[stripe/webhook] Missing userId on checkout session", session.id);
    return { ok: false, error: "Missing userId on checkout session." };
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (plan === "unlimited" || session.mode === "subscription") {
    const stripe = getStripe();
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;

    let status = "active";
    let currentPeriodEnd: string | null = null;
    let cancelAtPeriodEnd = false;

    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      status = sub.status;
      currentPeriodEnd = subscriptionPeriodEnd(sub);
      cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
    }

    const membership = await upsertStripeMembership({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      metadata: { checkoutSessionId: session.id, plan: "unlimited" },
    });

    if (!membership.ok) {
      console.error("[stripe/webhook] membership upsert failed", membership.error);
      return { ok: false, error: membership.error };
    }

    // Also unlock the listing they checked out from, for an immediate win.
    if (listingId) {
      const grant = await grantListingUnlock({
        userId,
        listingId,
        source: "stripe_subscription",
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        stripeCustomerId: customerId,
        amountCents: session.amount_total,
        currency: session.currency ?? "usd",
        metadata: { plan: "unlimited" },
      });
      if (!grant.ok) {
        console.error("[stripe/webhook] listing grant failed", grant.error);
        // Membership still granted — treat as ok for unlimited plan.
      }
    }
    return { ok: true };
  }

  if (!listingId) {
    console.error("[stripe/webhook] Missing listingId on payment checkout", session.id);
    return { ok: false, error: "Missing listingId on checkout session." };
  }

  const grant = await grantListingUnlock({
    userId,
    listingId,
    source: "stripe_one_time",
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    stripeCustomerId: customerId,
    amountCents: session.amount_total,
    currency: session.currency ?? "usd",
    metadata: { plan: "unlock" },
  });

  if (!grant.ok) {
    console.error("[stripe/webhook] listing grant failed", grant.error);
    return { ok: false, error: grant.error };
  }

  return { ok: true };
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = subscription.metadata?.userId?.trim() || "";
  if (!userId) {
    console.error(
      "[stripe/webhook] Missing userId on subscription",
      subscription.id,
    );
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  const result = await upsertStripeMembership({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: subscriptionPeriodEnd(subscription),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    metadata: { source: "subscription.updated" },
  });

  if (!result.ok) {
    console.error("[stripe/webhook] subscription update failed", result.error);
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = subscription.metadata?.userId?.trim() || "";
  if (!userId) {
    console.error(
      "[stripe/webhook] Missing userId on deleted subscription",
      subscription.id,
    );
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  const result = await upsertStripeMembership({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status: "canceled",
    currentPeriodEnd: subscriptionPeriodEnd(subscription),
    cancelAtPeriodEnd: false,
    metadata: { source: "subscription.deleted" },
  });

  if (!result.ok) {
    console.error("[stripe/webhook] subscription delete failed", result.error);
  }
}
