import type { StripeCheckoutPlan } from "@/lib/stripe/types";

export type StartCheckoutResult =
  | { ok: true }
  | { ok: false; loginRequired?: boolean; error: string };

/**
 * Starts Stripe Checkout for a listing unlock or unlimited membership.
 * Redirects the browser to Stripe on success.
 */
export async function startStripeCheckout(input: {
  listingId: string;
  plan: StripeCheckoutPlan;
  returnPath?: string;
}): Promise<StartCheckoutResult> {
  const returnPath =
    input.returnPath ||
    (typeof window !== "undefined" ? window.location.pathname : "/");

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
      error?: string;
      loginRequired?: boolean;
    };

    if (res.status === 401 || data.loginRequired) {
      const next = new URL(returnPath, window.location.origin);
      next.searchParams.set("login", "required");
      window.location.href = next.toString();
      return { ok: false, loginRequired: true, error: "Sign in required." };
    }

    if (!res.ok || !data.url) {
      return {
        ok: false,
        error: data.error || "Could not start checkout. Try again.",
      };
    }

    window.location.href = data.url;
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error starting checkout." };
  }
}
