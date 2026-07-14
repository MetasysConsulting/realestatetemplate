export async function confirmStripeCheckout(input: {
  listingId: string;
  sessionId?: string | null;
}): Promise<{ ok: boolean; unlocked: boolean; needsLogin?: boolean; error?: string }> {
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
      needsLogin?: boolean;
      error?: string;
      loginRequired?: boolean;
    };

    if (res.ok && data.unlocked) {
      try {
        sessionStorage.removeItem("reovana_checkout_session");
        sessionStorage.removeItem("reovana_checkout_listing");
      } catch {
        /* ignore */
      }
      return { ok: true, unlocked: true, needsLogin: Boolean(data.needsLogin) };
    }

    if (res.status === 401 || data.loginRequired) {
      return {
        ok: false,
        unlocked: false,
        needsLogin: true,
        error: data.error || "Sign in required to finish unlocking.",
      };
    }

    return {
      ok: false,
      unlocked: false,
      needsLogin: Boolean(data.needsLogin),
      error: data.error || "Could not confirm unlock after payment.",
    };
  } catch {
    return { ok: false, unlocked: false, error: "Network error confirming payment." };
  }
}

/** Send user to login, then back to this listing (keeps session_id for confirm). */
export function redirectToLoginForUnlock(): void {
  const next = `${window.location.pathname}${window.location.search}`;
  const url = new URL("/", window.location.origin);
  url.searchParams.set("login", "required");
  url.searchParams.set("next", next);
  window.location.href = url.toString();
}
