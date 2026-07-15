"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type FavoriteButtonProps = {
  listingId: string;
  className?: string;
  /** Preloaded from parent when listing many cards. */
  initialFavorited?: boolean;
};

export function FavoriteButton({
  listingId,
  className = "",
  initialFavorited,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(Boolean(initialFavorited));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof initialFavorited === "boolean") {
      setFavorited(initialFavorited);
    }
  }, [initialFavorited, listingId]);

  const toggle = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (loading) return;

      setLoading(true);

      try {
        if (favorited) {
          const res = await fetch(
            `/api/member/favorites?listingId=${encodeURIComponent(listingId)}`,
            { method: "DELETE", credentials: "same-origin" },
          );
          if (res.status === 401) {
            const next = encodeURIComponent(
              `${window.location.pathname}${window.location.search}`,
            );
            router.push(`/?login=required&next=${next}`);
            return;
          }
          if (res.ok) setFavorited(false);
        } else {
          const res = await fetch("/api/member/favorites", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId }),
          });
          if (res.status === 401) {
            const next = encodeURIComponent(
              `${window.location.pathname}${window.location.search}`,
            );
            router.push(`/?login=required&next=${next}`);
            return;
          }
          if (res.ok) setFavorited(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [favorited, listingId, loading, router],
  );

  return (
    <button
      type="button"
      className={`reovana-favorite-btn${favorited ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={favorited}
      disabled={loading}
      onClick={toggle}
      title={favorited ? "Saved" : "Save to favorites"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21s-7.2-4.35-9.6-8.1C.6 9.9 2.2 6.5 5.6 5.4c2-.7 4.1.1 5.5 1.7 1.4-1.6 3.5-2.4 5.5-1.7 3.4 1.1 5 4.5 3.2 7.5C19.2 16.65 12 21 12 21z"
          fill={favorited ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/** Load favorite ids once for a list of cards. */
export function useFavoriteIds() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/member/favorites", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { ids: [] }))
      .then((data: { ids?: string[] }) => {
        if (cancelled) return;
        setIds(new Set(Array.isArray(data.ids) ? data.ids : []));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ids, ready };
}
