import "server-only";

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { handleCheckoutSessionCompleted } from "@/lib/stripe/webhook-handlers";
import { toListingUnlockId, userHasListingUnlock } from "@/lib/unlocks/entitlements";
import { userHasActiveMembership } from "@/lib/unlocks/membership";

export type FulfillCheckoutResult = {
  ok: boolean;
  unlocked: boolean;
  error?: string;
  sessionId?: string;
};

function isPaid(session: Stripe.Checkout.Session): boolean {
  if (session.payment_status === "paid") return true;
  // Some subscription checkouts can briefly report "unpaid" while status is complete.
  return session.status === "complete" && session.mode === "subscription";
}

function sessionBelongsToUser(session: Stripe.Checkout.Session, userId: string): boolean {
  const metaUser = session.metadata?.userId?.trim() || "";
  const ref = session.client_reference_id?.trim() || "";
  return metaUser === userId || ref === userId;
}

export async function fulfillCheckoutSessionForUser(input: {
  userId: string;
  sessionId?: string | null;
  listingId?: string | null;
}): Promise<FulfillCheckoutResult> {
  const stripe = getStripe();
  const listingId = input.listingId ? toListingUnlockId(input.listingId) : "";
  let session: Stripe.Checkout.Session | null = null;

  if (input.sessionId?.trim()) {
    session = await stripe.checkout.sessions.retrieve(input.sessionId.trim());
  } else if (listingId) {
    // Recovery path when success URL omitted session_id (your stuck checkout).
    const listed = await stripe.checkout.sessions.list({ limit: 25 });
    session =
      listed.data.find(
        (row) =>
          isPaid(row) &&
          sessionBelongsToUser(row, input.userId) &&
          toListingUnlockId(row.metadata?.listingId || "") === listingId,
      ) ?? null;
  }

  if (!session) {
    return {
      ok: false,
      unlocked: false,
      error: "Could not find a paid checkout session for this listing.",
    };
  }

  if (!sessionBelongsToUser(session, input.userId)) {
    return { ok: false, unlocked: false, error: "Checkout session belongs to another account." };
  }

  if (!isPaid(session)) {
    return {
      ok: false,
      unlocked: false,
      error: `Checkout is not paid yet (status: ${session.payment_status}).`,
      sessionId: session.id,
    };
  }

  const fulfilled = await handleCheckoutSessionCompleted(session);
  if (!fulfilled.ok) {
    return {
      ok: false,
      unlocked: false,
      error:
        fulfilled.error ||
        "Payment verified, but unlocking failed. Confirm SUPABASE_SERVICE_ROLE_KEY is set on Vercel.",
      sessionId: session.id,
    };
  }

  const plan = session.metadata?.plan || (session.mode === "subscription" ? "unlimited" : "unlock");
  const sessionListingId = toListingUnlockId(session.metadata?.listingId || listingId);
  const unlocked =
    plan === "unlimited"
      ? await userHasActiveMembership(input.userId)
      : sessionListingId
        ? await userHasListingUnlock(input.userId, sessionListingId)
        : false;

  if (!unlocked) {
    return {
      ok: false,
      unlocked: false,
      error:
        "Payment verified, but unlock row is not readable yet. Refresh once, or confirm SUPABASE_SERVICE_ROLE_KEY on Vercel.",
      sessionId: session.id,
    };
  }

  return { ok: true, unlocked: true, sessionId: session.id };
}
