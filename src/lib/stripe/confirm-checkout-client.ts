export async function confirmStripeCheckout(input: {
  listingId: string;
  sessionId?: string | null;
}): Promise<{ ok: boolean; unlocked: boolean; error?: string }> {
  let sessionId = input.sessionId?.trim() || "";
  if (!sessionId) {
    try {
      sessionId = sessionStorage.getItem("reovana_checkout_session") || "";
    } catch {
      sessionId = "";
    }
  }

  try {
    const res = await fetch("/api/stripe/confirm", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: input.listingId,
        sessionId: sessionId || undefined,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      unlocked?: boolean;
      error?: string;
    };

    if (res.ok && data.unlocked) {
      try {
        sessionStorage.removeItem("reovana_checkout_session");
        sessionStorage.removeItem("reovana_checkout_listing");
      } catch {
        /* ignore */
      }
      return { ok: true, unlocked: true };
    }

    return {
      ok: false,
      unlocked: false,
      error: data.error || "Could not confirm unlock after payment.",
    };
  } catch {
    return { ok: false, unlocked: false, error: "Network error confirming payment." };
  }
}
