import "server-only";

import type Stripe from "stripe";
import {
  getStripePriceUnlimited,
  getStripePriceUnlock,
  STRIPE_UNLIMITED_AMOUNT_CENTS,
  STRIPE_UNLOCK_AMOUNT_CENTS,
} from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import type { StripeCheckoutPlan } from "@/lib/stripe/types";
import { toListingUnlockId } from "@/lib/unlocks/entitlements";

export type CreateCheckoutSessionInput = {
  userId: string;
  userEmail?: string | null;
  listingId: string;
  plan: StripeCheckoutPlan;
  successUrl: string;
  cancelUrl: string;
};

function unlockLineItem(listingId: string): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceId = getStripePriceUnlock();
  if (priceId) {
    return { price: priceId, quantity: 1 };
  }
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: STRIPE_UNLOCK_AMOUNT_CENTS,
      product_data: {
        name: "Unlock this property",
        description: `REOVANA listing unlock (${listingId})`,
      },
    },
  };
}

function unlimitedLineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceId = getStripePriceUnlimited();
  if (priceId) {
    return { price: priceId, quantity: 1 };
  }
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: STRIPE_UNLIMITED_AMOUNT_CENTS,
      recurring: { interval: "month" },
      product_data: {
        name: "REOVANA Unlimited Access",
        description: "Unlimited listing unlocks while subscribed",
      },
    },
  };
}

export async function createListingCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const listingId = toListingUnlockId(input.listingId);
  const plan = input.plan;
  const mode: Stripe.Checkout.SessionCreateParams.Mode =
    plan === "unlimited" ? "subscription" : "payment";

  const metadata: Record<string, string> = {
    userId: input.userId,
    listingId,
    plan,
  };

  return stripe.checkout.sessions.create({
    mode,
    customer_email: input.userEmail || undefined,
    client_reference_id: input.userId,
    line_items: [plan === "unlimited" ? unlimitedLineItem() : unlockLineItem(listingId)],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata,
    payment_intent_data:
      mode === "payment"
        ? {
            metadata,
          }
        : undefined,
    subscription_data:
      mode === "subscription"
        ? {
            metadata,
          }
        : undefined,
  });
}
