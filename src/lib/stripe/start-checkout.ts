import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/client";
import type { StripeCheckoutPlan } from "@/lib/stripe/types";
import { redirectToLoginForUnlock } from "@/lib/stripe/confirm-checkout-client";

export type StartCheckoutResult =
  | { ok: true }
  | { ok: false; loginRequired?: boolean; error: string };

/**
 * Starts Stripe Checkout for a listing unlock or unlimited membership.
 * Requires a signed-in REOVANA account — guests are sent to login first.
 */
export async function startStripeCheckout(input: {
  listingId: string;
  plan: StripeCheckoutPlan;
  returnPath?: string;
}): Promise<StartCheckoutResult> {
  const returnPath =
    input.returnPath ||
    (typeof window !== "undefined" ? window.location.pathname : "/");

  const supabase = tryCreateSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, error: "Sign-in isn’t configured right now." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirectToLoginForUnlock();
    return {
      ok: false,
      loginRequired: true,
      error: "Create a free account or sign in before purchasing.",
    };
  }

  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: input.listingId,
        plan: input.plan,
        returnPath,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      sessionId?: string;
      error?: string;
      loginRequired?: boolean;
    };

    if (res.status === 401 || data.loginRequired) {
      redirectToLoginForUnlock();
      return {
        ok: false,
        loginRequired: true,
        error: "Create a free account or sign in before purchasing.",
      };
    }

    if (!res.ok || !data.url) {
      return {
        ok: false,
        error: data.error || "Could not start checkout. Try again.",
      };
    }

    try {
      if (data.sessionId) {
        sessionStorage.setItem("reovana_checkout_session", data.sessionId);
        sessionStorage.setItem("reovana_checkout_listing", input.listingId);
      }
    } catch {
      /* private browsing */
    }

    window.location.href = data.url;
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error starting checkout." };
  }
}
