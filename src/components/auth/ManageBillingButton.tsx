"use client";

import { useState, useTransition, type ReactNode } from "react";

type ManageBillingButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function ManageBillingButton({
  className = "tf-btn bg-color-primary pd-20",
  children = "Manage subscription",
}: ManageBillingButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/portal", {
          method: "POST",
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };
        if (!res.ok || !data.url) {
          setError(data.error || "Could not open Stripe billing.");
          return;
        }
        window.location.href = data.url;
      } catch {
        setError("Network error opening billing.");
      }
    });
  };

  return (
    <div className="reovana-billing__portal">
      <button type="button" className={className} onClick={onClick} disabled={isPending}>
        {isPending ? "Opening Stripe…" : children}
      </button>
      {error ? <p className="reovana-billing__error">{error}</p> : null}
    </div>
  );
}
