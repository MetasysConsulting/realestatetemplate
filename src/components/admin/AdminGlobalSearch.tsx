"use client";

import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Search, Users } from "lucide-react";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import type { AdminSearchSuggestResult } from "@/lib/admin/admin-search-types";

const EMPTY: AdminSearchSuggestResult = {
  listings: [],
  members: [],
  seeAllListingsHref: null,
};

export default function AdminGlobalSearch({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AdminSearchSuggestResult>(EMPTY);
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(
          `/admin/api/search/suggest?q=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
            cache: "no-store",
            credentials: "same-origin",
          },
        );
        if (!res.ok) {
          setResults(EMPTY);
          return;
        }
        const data = (await res.json()) as AdminSearchSuggestResult;
        if (!controller.signal.aborted) {
          setResults(data);
          setOpen(true);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults(EMPTY);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    startTransition(() => {
      router.push(href);
    });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    go(`/admin/listings?q=${encodeURIComponent(q)}`);
  };

  const hasResults = results.listings.length > 0 || results.members.length > 0;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form onSubmit={onSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          placeholder={compact ? "Search…" : "Search listings, members…"}
          className="pl-9 h-9 pr-9"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
        />
        {(loading || isPending) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </form>

      {open && query.trim().length >= 2 ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#1c2433] shadow-2xl shadow-black/40"
        >
          {loading && !hasResults ? (
            <div className="px-3 py-4 text-sm text-white/50 text-center">Searching…</div>
          ) : !hasResults ? (
            <div className="px-3 py-4 text-sm text-white/50 text-center">
              No matches for “{query.trim()}”
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto py-1">
              {results.listings.length > 0 ? (
                <div>
                  <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" /> Listings
                  </p>
                  {results.listings.map((item) => (
                    <button
                      key={`listing-${item.id}`}
                      type="button"
                      role="option"
                      className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                      onClick={() => go(item.href)}
                    >
                      <p className="text-sm text-white truncate">{item.label}</p>
                      <p className="text-xs text-white/45 truncate">{item.sublabel}</p>
                    </button>
                  ))}
                </div>
              ) : null}

              {results.members.length > 0 ? (
                <div>
                  <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> Members
                  </p>
                  {results.members.map((item) => (
                    <button
                      key={`member-${item.id}`}
                      type="button"
                      role="option"
                      className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                      onClick={() => go(item.href)}
                    >
                      <p className="text-sm text-white truncate">{item.label}</p>
                      <p className="text-xs text-white/45 truncate">{item.sublabel}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {results.seeAllListingsHref ? (
            <div className="border-t border-white/10 p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-primary"
                onClick={() => go(results.seeAllListingsHref!)}
              >
                View all matching listings
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
