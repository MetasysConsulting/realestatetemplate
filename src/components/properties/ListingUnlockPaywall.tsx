"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchPaywallAccess } from "@/lib/property-gate";
import { confirmStripeCheckout, redirectToLoginForUnlock } from "@/lib/stripe/confirm-checkout-client";
import { startStripeCheckout } from "@/lib/stripe/start-checkout";
import type { StripeCheckoutPlan } from "@/lib/stripe/types";

type ListingUnlockPaywallProps = {
  unlocked: boolean;
  listingId: string;
  onUnlocked?: () => void;
};

const INCLUDED = [
  "Exact list price",
  "Full street address",
  "Beds, baths & square footage",
  "Amenities and property facts",
  "Seller phone & email",
] as const;

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 10.5V8.25a4.5 4.5 0 0 1 9 0V10.5M6.75 10.5h10.5A1.75 1.75 0 0 1 19 12.25v7A1.75 1.75 0 0 1 17.25 21H6.75A1.75 1.75 0 0 1 5 19.25v-7A1.75 1.75 0 0 1 6.75 10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.25 6.5 11.25 12.5 4.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ListingUnlockPaywall({
  unlocked,
  listingId,
  onUnlocked,
}: ListingUnlockPaywallProps) {
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(unlocked);

  useEffect(() => {
    setIsUnlocked(unlocked);
  }, [unlocked]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "cancelled") {
      setNotice("Checkout cancelled. Your card was not charged.");
      return;
    }
    if (checkout !== "success") return;

    let cancelled = false;
    const sessionId = params.get("session_id");

    const finishUnlocked = () => {
      if (cancelled) return;
      setIsUnlocked(true);
      setNotice("Unlocked. Refreshing details…");
      onUnlocked?.();
      window.setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("checkout");
        url.searchParams.delete("plan");
        url.searchParams.delete("session_id");
        window.location.replace(url.pathname + url.search);
      }, 400);
    };

    setNotice("Payment received — unlocking this listing…");

    void (async () => {
      const confirmed = await confirmStripeCheckout({ listingId, sessionId });
      if (cancelled) return;

      if (confirmed.unlocked) {
        if (confirmed.needsLogin) {
          setNotice("Payment saved. Sign in with the same account to view the unlocked listing…");
          window.setTimeout(() => redirectToLoginForUnlock(), 800);
          return;
        }
        finishUnlocked();
        return;
      }

      if (confirmed.needsLogin) {
        setNotice("Sign in with the account that paid to finish unlocking…");
        window.setTimeout(() => redirectToLoginForUnlock(), 800);
        return;
      }

      // Fallback: poll in case webhook wins the race after confirm looked too early.
      for (let attempt = 0; attempt < 6 && !cancelled; attempt += 1) {
        await new Promise((r) => window.setTimeout(r, 1000));
        const access = await fetchPaywallAccess(listingId);
        if (access.unlocked) {
          finishUnlocked();
          return;
        }
      }

      if (!cancelled) {
        setNotice(
          confirmed.error ||
            "Payment received, but unlock didn’t apply yet. Stay signed in, confirm SUPABASE_SECRET_KEY is on Vercel, then refresh this success link.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listingId, onUnlocked]);

  if (isUnlocked) {
    return null;
  }

  const handleCheckout = (plan: StripeCheckoutPlan) => {
    setNotice(null);
    startTransition(async () => {
      const result = await startStripeCheckout({ listingId, plan });
      if (!result.ok && !result.loginRequired) {
        setNotice(result.error);
      }
    });
  };

  return (
    <aside className="reovana-unlock-card mb-30" aria-label="Unlock property details">
      <div className="reovana-unlock-card__head">
        <span className="reovana-unlock-card__badge">
          <LockIcon />
          Members only
        </span>
        <h4 className="reovana-unlock-card__title">Unlock this listing</h4>
        <p className="reovana-unlock-card__subtitle">
          Reveal the full address, pricing, specs, and seller contact in one step.
        </p>
      </div>

      <div className="reovana-unlock-card__body">
        <ul className="reovana-unlock-card__perks">
          {INCLUDED.map((item) => (
            <li key={item}>
              <span className="reovana-unlock-card__check">
                <CheckIcon />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="reovana-unlock-card__actions">
          <button
            type="button"
            className="reovana-unlock-card__primary"
            onClick={() => handleCheckout("unlock")}
            disabled={isPending}
          >
            <span className="reovana-unlock-card__price-row">
              <span>{isPending ? "Starting checkout…" : "Unlock this property"}</span>
              <strong>$4.99</strong>
            </span>
          </button>
          <button
            type="button"
            className="reovana-unlock-card__secondary"
            onClick={() => handleCheckout("unlimited")}
            disabled={isPending}
          >
            <span className="reovana-unlock-card__price-row">
              <span>Unlimited access</span>
              <strong>$49/mo</strong>
            </span>
          </button>
        </div>

        {notice ? (
          <p className="reovana-unlock-card__notice" role="status">
            {notice}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
