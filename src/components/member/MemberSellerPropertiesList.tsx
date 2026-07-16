"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SellerPropertyRow } from "@/lib/seller/property-types";

function formatPrice(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "Price TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Live";
    case "pending_payment":
      return "Pending payment";
    case "draft":
      return "Draft";
    case "inactive":
      return "Inactive";
    default:
      return status;
  }
}

type MemberSellerPropertiesListProps = {
  properties: SellerPropertyRow[];
  hasActiveSellerSub: boolean;
  checkoutNotice?: string | null;
  checkoutError?: string | null;
};

export function MemberSellerPropertiesList({
  properties,
  hasActiveSellerSub,
  checkoutNotice,
  checkoutError,
}: MemberSellerPropertiesListProps) {
  const router = useRouter();
  const [rows, setRows] = useState(properties);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(checkoutError ?? null);

  useEffect(() => {
    setRows(properties);
  }, [properties]);

  const activate = async (propertyId: string) => {
    if (activatingId) return;
    setActivatingId(propertyId);
    setError(null);
    try {
      if (hasActiveSellerSub) {
        const res = await fetch("/api/seller/properties", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "activate", propertyId }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (res.status === 401) {
          router.push("/?login=required&next=/my-property");
          return;
        }
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Could not publish listing.");
          return;
        }
        router.refresh();
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "seller_listing",
          propertyId,
          returnPath: "/my-property",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.status === 401) {
        router.push("/?login=required&next=/my-property");
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = data.url;
    } finally {
      setActivatingId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="reovana-member-empty">
        {checkoutNotice ? <p className="reovana-member-notice">{checkoutNotice}</p> : null}
        {error ? <p className="reovana-add-property__error">{error}</p> : null}
        <p>You have not listed a property yet.</p>
        <p className="reovana-member-empty__hint">
          Use Add Property to submit a listing, then activate with the $49/month seller
          subscription.
        </p>
        <a href="/add-property" className="tf-btn bg-color-primary pd-20">
          Add property
        </a>
      </div>
    );
  }

  return (
    <div className="reovana-seller-list">
      {checkoutNotice ? <p className="reovana-member-notice">{checkoutNotice}</p> : null}
      {error ? <p className="reovana-add-property__error">{error}</p> : null}
      {!hasActiveSellerSub ? (
        <p className="reovana-member-panel__empty">
          A <strong>$49/month</strong> seller listing subscription is required to keep listings
          live.
        </p>
      ) : null}
      <ul className="reovana-member-list">
        {rows.map((row) => (
          <li key={row.id} className="reovana-member-list__item">
            <div className="reovana-member-list__link" style={{ cursor: "default" }}>
              <div className="reovana-member-list__thumb">
                {row.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.imageUrls[0]}
                    alt=""
                    className="reovana-member-list__thumb-img"
                  />
                ) : (
                  <div className="reovana-member-list__thumb-fallback" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                      <path
                        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.5v-5.5h-3V21H5a1 1 0 0 1-1-1v-9.5Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="reovana-member-list__body">
                <span className="reovana-member-list__badge">{statusLabel(row.status)}</span>
                <h3>
                  {row.title?.trim() ||
                    `${row.address}, ${row.city}, ${row.state} ${row.zip}`}
                </h3>
                {row.title?.trim() ? (
                  <p className="reovana-member-list__meta">
                    {row.address}, {row.city}, {row.state} {row.zip}
                  </p>
                ) : null}
                <p className="reovana-member-list__price">{formatPrice(row.price)}</p>
                <p className="reovana-member-list__meta">
                  {[
                    row.propertyType,
                    row.bedrooms ? `${row.bedrooms} bd` : null,
                    row.bathrooms ? `${row.bathrooms} ba` : null,
                    row.squareFootage ? `${row.squareFootage.toLocaleString()} sqft` : null,
                    row.lat != null && row.lng != null ? "Map pin set" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Details TBD"}
                </p>
              </div>
            </div>
            {row.status === "pending_payment" || row.status === "draft" || row.status === "inactive" ? (
              <button
                type="button"
                className="reovana-member-list__remove"
                disabled={activatingId === row.id}
                onClick={() => void activate(row.id)}
              >
                {activatingId === row.id
                  ? "Working…"
                  : hasActiveSellerSub
                    ? "Publish listing"
                    : "Activate $49/mo"}
              </button>
            ) : row.status === "active" ? (
              <a
                className="reovana-member-list__remove"
                href={`/buy/off-market/seller-${row.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View public page
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
