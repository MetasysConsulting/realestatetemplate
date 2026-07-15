"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * After Stripe redirects back to /my-property?checkout=success&session_id=…
 * confirm fulfillment if the webhook lagged.
 */
export function SellerCheckoutConfirm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    if (params.get("plan") !== "seller_listing") return;
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    let cancelled = false;
    void fetch("/api/stripe/confirm", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data: { ok?: boolean; error?: string }) => {
        if (cancelled) return;
        setMessage(
          data.ok
            ? "Listing subscription active. Your property is live."
            : data.error || "Payment received — refreshing your listings…",
        );
        router.replace("/my-property");
        router.refresh();
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("Payment received — refreshing your listings…");
          router.refresh();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!message) return null;
  return <p className="reovana-member-notice">{message}</p>;
}
