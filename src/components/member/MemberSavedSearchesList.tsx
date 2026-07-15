"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { describeSavedSearchQuery, type SavedSearchRow } from "@/lib/member/saved-search-display";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type MemberSavedSearchesListProps = {
  searches: SavedSearchRow[];
};

export function MemberSavedSearchesList({ searches }: MemberSavedSearchesListProps) {
  const router = useRouter();
  const [rows, setRows] = useState(searches);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setRows(searches);
  }, [searches]);

  const remove = async (id: string) => {
    if (removingId) return;
    setRemovingId(id);
    try {
      const res = await fetch(`/api/member/saved-searches?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        setRows((current) => current.filter((r) => r.id !== id));
        router.refresh();
      }
    } finally {
      setRemovingId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="reovana-member-empty">
        <p>No saved searches yet.</p>
        <Link href="/search" className="tf-btn bg-color-primary pd-20">
          Run a map search
        </Link>
      </div>
    );
  }

  return (
    <div className="reovana-member-table-wrap">
      <table className="reovana-member-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Parameters</th>
            <th>Date</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <Link href={row.searchUrl} className="reovana-member-table__title">
                  {row.title}
                </Link>
              </td>
              <td className="reovana-member-table__params">
                {describeSavedSearchQuery(row.queryJson)}
              </td>
              <td>{formatDate(row.createdAt)}</td>
              <td>
                <button
                  type="button"
                  className="reovana-member-table__remove"
                  disabled={removingId === row.id}
                  onClick={() => void remove(row.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
