import "server-only";

import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { handleCheckoutSessionCompleted } from "@/lib/stripe/webhook-handlers";
import { toListingUnlockId, userHasListingUnlock } from "@/lib/unlocks/entitlements";
import { userHasActiveMembership } from "@/lib/unlocks/membership";
import { getSupabaseProjectUrl, getSupabaseServiceRoleKey } from "@/lib/supabase/env";

async function serviceHasListingUnlock(userId: string, listingId: string): Promise<boolean> {
  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return false;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("listing_unlocks")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", toListingUnlockId(listingId))
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt."${nowIso}"`)
    .limit(1)
    .maybeSingle();
  return !error && Boolean(data?.id);
}

async function serviceHasActiveMembership(userId: string): Promise<boolean> {
  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return false;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client
    .from("stripe_memberships")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return false;
  if (!["active", "trialing"].includes(String(data.status))) return false;
  if (!data.current_period_end) return true;
  return new Date(String(data.current_period_end)).getTime() > Date.now();
}

export type FulfillCheckoutResult = {
  ok: boolean;
  unlocked: boolean;
  needsLogin?: boolean;
  error?: string;
  sessionId?: string;
  paidUserId?: string;
};

function isPaid(session: Stripe.Checkout.Session): boolean {
  if (session.payment_status === "paid") return true;
  return session.status === "complete" && session.mode === "subscription";
}

function sessionUserId(session: Stripe.Checkout.Session): string {
  return session.metadata?.userId?.trim() || session.client_reference_id?.trim() || "";
}

function sessionBelongsToUser(session: Stripe.Checkout.Session, userId: string): boolean {
  return sessionUserId(session) === userId;
}

export async function fulfillCheckoutSessionForUser(input: {
  /** Signed-in user id, if any. When omitted, a valid paid session_id alone can fulfill. */
  userId?: string | null;
  sessionId?: string | null;
  listingId?: string | null;
}): Promise<FulfillCheckoutResult> {
  const stripe = getStripe();
  const listingId = input.listingId ? toListingUnlockId(input.listingId) : "";
  let session: Stripe.Checkout.Session | null = null;

  if (input.sessionId?.trim()) {
    session = await stripe.checkout.sessions.retrieve(input.sessionId.trim());
  } else if (listingId && input.userId) {
    const listed = await stripe.checkout.sessions.list({ limit: 25 });
    session =
      listed.data.find(
        (row) =>
          isPaid(row) &&
          sessionBelongsToUser(row, input.userId!) &&
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

  const paidUserId = sessionUserId(session);
  if (!paidUserId) {
    return {
      ok: false,
      unlocked: false,
      error: "Checkout session is missing the paying user id.",
      sessionId: session.id,
    };
  }

  // If someone is signed in, they must be the payer. Anonymous is OK when session_id proves payment.
  if (input.userId && input.userId !== paidUserId) {
    return {
      ok: false,
      unlocked: false,
      error: "Checkout session belongs to another account. Sign in with the account that paid.",
      sessionId: session.id,
    };
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
        "Payment verified, but unlocking failed. Confirm SUPABASE_SECRET_KEY (service role) is set on Vercel.",
      sessionId: session.id,
      paidUserId,
    };
  }

  const plan = session.metadata?.plan || (session.mode === "subscription" ? "unlimited" : "unlock");
  const sessionListingId = toListingUnlockId(session.metadata?.listingId || listingId);

  // Prefer the authenticated user's read path when present; otherwise verify via service role.
  let unlocked = false;
  if (input.userId) {
    unlocked =
      plan === "unlimited"
        ? await userHasActiveMembership(input.userId)
        : sessionListingId
          ? await userHasListingUnlock(input.userId, sessionListingId)
          : false;
  } else if (plan === "unlimited") {
    unlocked = await serviceHasActiveMembership(paidUserId);
  } else if (sessionListingId) {
    unlocked = await serviceHasListingUnlock(paidUserId, sessionListingId);
  } else {
    unlocked = fulfilled.ok;
  }

  if (!unlocked) {
    return {
      ok: false,
      unlocked: false,
      error:
        "Payment verified, but unlock row is not readable yet. Confirm SUPABASE_SECRET_KEY is set on Vercel, then retry.",
      sessionId: session.id,
      paidUserId,
      needsLogin: !input.userId,
    };
  }

  return {
    ok: true,
    unlocked: true,
    sessionId: session.id,
    paidUserId,
    needsLogin: !input.userId,
  };
}
