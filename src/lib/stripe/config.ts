import "server-only";

export type { StripeCheckoutPlan } from "@/lib/stripe/types";

export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY?.trim() || undefined;
}

export function getStripeWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || undefined;
}

export function getStripePublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || undefined;
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeSecretKey());
}

/** Prefer Dashboard Price IDs; fall back to inline price_data so checkout works before products exist. */
export function getStripePriceUnlock(): string | undefined {
  return process.env.STRIPE_PRICE_UNLOCK?.trim() || undefined;
}

export function getStripePriceUnlimited(): string | undefined {
  return process.env.STRIPE_PRICE_UNLIMITED?.trim() || undefined;
}

export const STRIPE_UNLOCK_AMOUNT_CENTS = 499;
export const STRIPE_UNLIMITED_AMOUNT_CENTS = 4900;
