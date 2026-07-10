"use client";

import { useOptimistic, useTransition } from "react";

type ListingUnlockPaywallProps = {
  unlocked: boolean;
  onUnlock: () => void;
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

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.75 13.25 4v3.4c0 3.15-2.1 5.95-5.25 6.85C4.85 13.35 2.75 10.55 2.75 7.4V4L8 1.75Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ListingUnlockPaywall({ unlocked, onUnlock }: ListingUnlockPaywallProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticUnlocked, setOptimisticUnlocked] = useOptimistic(unlocked);

  if (optimisticUnlocked) {
    return null;
  }

  const unlock = () => {
    startTransition(() => {
      setOptimisticUnlocked(true);
      onUnlock();
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
            onClick={unlock}
            disabled={isPending}
          >
            <span className="reovana-unlock-card__price-row">
              <span>Unlock this property</span>
              <strong>$4.99</strong>
            </span>
          </button>
          <button
            type="button"
            className="reovana-unlock-card__secondary"
            onClick={unlock}
            disabled={isPending}
          >
            <span className="reovana-unlock-card__price-row">
              <span>Unlimited access</span>
              <strong>$49/mo</strong>
            </span>
          </button>
        </div>

        <p className="reovana-unlock-card__secure">
          <ShieldIcon />
          Secure checkout · Stripe
        </p>
      </div>
    </aside>
  );
}
