"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MemberListingRow } from "@/lib/member/listing-rows";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function ListingThumb({ row }: { row: MemberListingRow }) {
  if (row.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={row.imageUrl} alt="" className="reovana-member-list__thumb-img" loading="lazy" />
    );
  }
  return (
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
  );
}

type MemberFavoritesListProps = {
  favorites: MemberListingRow[];
};

export function MemberFavoritesList({ favorites }: MemberFavoritesListProps) {
  const router = useRouter();
  const [rows, setRows] = useState(favorites);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setRows(favorites);
  }, [favorites]);

  const remove = async (listingId: string) => {
    if (removingId) return;
    setRemovingId(listingId);
    try {
      const res = await fetch(
        `/api/member/favorites?listingId=${encodeURIComponent(listingId)}`,
        { method: "DELETE", credentials: "same-origin" },
      );
      if (res.ok) {
        setRows((current) => current.filter((r) => r.listingId !== listingId));
        router.refresh();
      }
    } finally {
      setRemovingId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="reovana-member-empty">
        <p>No saved favorites yet.</p>
        <Link href="/search" className="tf-btn bg-color-primary pd-20">
          Browse map search
        </Link>
      </div>
    );
  }

  return (
    <ul className="reovana-member-list">
      {rows.map((row) => (
        <li key={row.listingId} className="reovana-member-list__item">
          <Link href={row.detailPath} className="reovana-member-list__link">
            <div className="reovana-member-list__thumb">
              <ListingThumb row={row} />
            </div>
            <div className="reovana-member-list__body">
              {row.categoryLabel ? (
                <span className="reovana-member-list__badge">{row.categoryLabel}</span>
              ) : null}
              <h3>{row.label}</h3>
              {row.priceLabel ? <p className="reovana-member-list__price">{row.priceLabel}</p> : null}
              <p className="reovana-member-list__meta">Saved {formatDate(row.savedAt)}</p>
            </div>
          </Link>
          <button
            type="button"
            className="reovana-member-list__remove"
            disabled={removingId === row.listingId}
            onClick={() => void remove(row.listingId)}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
