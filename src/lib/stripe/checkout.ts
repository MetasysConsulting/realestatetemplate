import "server-only";

import type Stripe from "stripe";
import {
  getStripePriceSellerListing,
  getStripePriceUnlimited,
  getStripePriceUnlock,
  STRIPE_SELLER_LISTING_AMOUNT_CENTS,
  STRIPE_UNLIMITED_AMOUNT_CENTS,
  STRIPE_UNLOCK_AMOUNT_CENTS,
} from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import type { StripeCheckoutPlan } from "@/lib/stripe/types";
import { resolveAnyStripeCustomerIdForUser } from "@/lib/seller/properties";
import { toListingUnlockId } from "@/lib/unlocks/entitlements";

export type CreateCheckoutSessionInput = {
  userId: string;
  userEmail?: string | null;
  listingId: string;
  plan: StripeCheckoutPlan;
  successUrl: string;
  cancelUrl: string;
};

export type CreateSellerListingCheckoutInput = {
  userId: string;
  userEmail?: string | null;
  propertyId: string;
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

function sellerListingLineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceId = getStripePriceSellerListing();
  if (priceId) {
    return { price: priceId, quantity: 1 };
  }
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: STRIPE_SELLER_LISTING_AMOUNT_CENTS,
      recurring: { interval: "month" },
      product_data: {
        name: "REOVANA Seller Listing",
        description: "Publish and keep your for-sale listing live ($49/month)",
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
  if (plan === "seller_listing") {
    throw new Error("Use createSellerListingCheckoutSession for seller listing plans.");
  }
  const mode: Stripe.Checkout.SessionCreateParams.Mode =
    plan === "unlimited" ? "subscription" : "payment";

  const metadata: Record<string, string> = {
    userId: input.userId,
    listingId,
    plan,
  };

  const existingCustomerId = await resolveAnyStripeCustomerIdForUser(input.userId);

  return stripe.checkout.sessions.create({
    mode,
    ...(existingCustomerId
      ? { customer: existingCustomerId }
      : { customer_email: input.userEmail || undefined }),
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

export async function createSellerListingCheckoutSession(
  input: CreateSellerListingCheckoutInput,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const propertyId = input.propertyId.trim();
  if (!propertyId) {
    throw new Error("propertyId is required for seller listing checkout.");
  }

  const metadata: Record<string, string> = {
    userId: input.userId,
    propertyId,
    plan: "seller_listing",
  };

  const existingCustomerId = await resolveAnyStripeCustomerIdForUser(input.userId);

  return stripe.checkout.sessions.create({
    mode: "subscription",
    ...(existingCustomerId
      ? { customer: existingCustomerId }
      : { customer_email: input.userEmail || undefined }),
    client_reference_id: input.userId,
    line_items: [sellerListingLineItem()],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
  });
}
