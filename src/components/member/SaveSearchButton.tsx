"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SaveSearchButtonProps = {
  searchUrl: string;
  queryJson: Record<string, unknown>;
  title?: string;
};

export function SaveSearchButton({ searchUrl, queryJson, title }: SaveSearchButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSaved(false);
    setError(null);
  }, [searchUrl]);

  const onSave = async () => {
    if (loading || saved) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/member/saved-searches", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, searchUrl, queryJson }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.status === 401) {
        const next = encodeURIComponent(searchUrl);
        router.push(`/?login=required&next=${next}`);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Could not save search.");
        return;
      }

      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-map-save-search">
      {saved ? (
        <Link href="/my-save-search" className="search-map-save-search__btn is-saved">
          Saved · View
        </Link>
      ) : (
        <button
          type="button"
          className="search-map-save-search__btn"
          onClick={() => void onSave()}
          disabled={loading}
        >
          {loading ? "Saving…" : "Save search"}
        </button>
      )}
      {error ? <p className="search-map-save-search__error">{error}</p> : null}
    </div>
  );
}
