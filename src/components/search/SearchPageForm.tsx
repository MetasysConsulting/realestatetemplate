"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  attachSearchSuggestions,
  suggestionInputValue,
} from "@/lib/attach-search-suggestions";
import type { SearchSuggestion } from "@/lib/search-suggestion-types";
import { US_STATE_OPTIONS } from "@/lib/us-states";

type SearchPageFormProps = {
  q: string;
  state: string;
  propertyType: string;
  beds: number;
  baths: number;
  minPrice: number;
  maxPrice: number;
  pageSize: number;
};

const BED_OPTIONS = [1, 2, 3, 4, 5];
const BATH_OPTIONS = [1, 2, 3, 4];

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SearchPageForm({
  q,
  state,
  propertyType,
  beds,
  baths,
  minPrice,
  maxPrice,
  pageSize,
}: SearchPageFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const qInputRef = useRef<HTMLInputElement>(null);
  const stateSelectRef = useRef<HTMLSelectElement>(null);

  const hasActiveFilters = Boolean(
    q || state || propertyType || beds || baths || minPrice || maxPrice,
  );

  const handleSuggestionSelect = useEffectEvent((suggestion: SearchSuggestion) => {
    const qInput = qInputRef.current;
    const stateSelect = stateSelectRef.current;
    if (!qInput) return false;

    qInput.value = suggestionInputValue(suggestion);

    if (stateSelect) {
      if (suggestion.type === "state") {
        const match = US_STATE_OPTIONS.find(
          (s) =>
            s.abbr === suggestion.label.toUpperCase() ||
            s.name.toLowerCase() === suggestion.label.toLowerCase(),
        );
        if (match) stateSelect.value = match.abbr;
      } else if (suggestion.href.includes("state=")) {
        const stateParam = new URL(suggestion.href, window.location.origin).searchParams.get(
          "state",
        );
        if (stateParam) stateSelect.value = stateParam.toUpperCase();
      }
    }

    startTransition(() => {
      router.push(suggestion.href);
    });
    return false;
  });

  useEffect(() => {
    const input = qInputRef.current;
    if (!input) return;
    return attachSearchSuggestions(input, {
      onSelect: (suggestion) => handleSuggestionSelect(suggestion),
    });
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const text = String(value).trim();
      if (!text || (key === "pageSize" && text === "40")) continue;
      params.set(key, text);
    }
    const href = params.toString() ? `/search?${params}` : "/search";
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <section className="reovana-search-bar" aria-label="Search filters">
      <form className="reovana-search-bar__form" action="/search" method="get" onSubmit={onSubmit}>
        <div className="reovana-search-bar__grid">
          <label className="reovana-search-field reovana-search-field--query">
            <span className="reovana-search-field__label">Location</span>
            <div className="reovana-search-field__control reovana-search-suggest-host">
              <span className="reovana-search-field__icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                ref={qInputRef}
                name="q"
                defaultValue={q}
                placeholder="City, address, or ZIP"
                className="reovana-search-field__input"
                autoComplete="off"
              />
            </div>
          </label>

          <label className="reovana-search-field">
            <span className="reovana-search-field__label">State</span>
            <select
              ref={stateSelectRef}
              name="state"
              defaultValue={state}
              className="reovana-search-field__select"
            >
              <option value="">All states</option>
              {US_STATE_OPTIONS.map((s) => (
                <option key={s.abbr} value={s.abbr}>
                  {s.abbr} — {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="reovana-search-field">
            <span className="reovana-search-field__label">Type</span>
            <input
              name="propertyType"
              defaultValue={propertyType}
              placeholder="Any"
              className="reovana-search-field__input"
            />
          </label>

          <label className="reovana-search-field reovana-search-field--compact">
            <span className="reovana-search-field__label">Beds</span>
            <select name="beds" defaultValue={beds ? String(beds) : ""} className="reovana-search-field__select">
              <option value="">Any</option>
              {BED_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>

          <label className="reovana-search-field reovana-search-field--compact">
            <span className="reovana-search-field__label">Baths</span>
            <select name="baths" defaultValue={baths ? String(baths) : ""} className="reovana-search-field__select">
              <option value="">Any</option>
              {BATH_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>

          <label className="reovana-search-field reovana-search-field--price">
            <span className="reovana-search-field__label">Min $</span>
            <input
              name="minPrice"
              type="number"
              min={0}
              step={1000}
              defaultValue={minPrice ? String(minPrice) : ""}
              placeholder="Any"
              className="reovana-search-field__input"
            />
          </label>

          <label className="reovana-search-field reovana-search-field--price">
            <span className="reovana-search-field__label">Max $</span>
            <input
              name="maxPrice"
              type="number"
              min={0}
              step={1000}
              defaultValue={maxPrice ? String(maxPrice) : ""}
              placeholder="Any"
              className="reovana-search-field__input"
            />
          </label>

          <input type="hidden" name="pageSize" value={String(pageSize)} />

          <div className="reovana-search-bar__actions">
            {hasActiveFilters ? (
              <Link href="/search" className="reovana-search-bar__clear">
                Clear
              </Link>
            ) : (
              <span className="reovana-search-bar__clear-spacer" aria-hidden="true" />
            )}
            <button type="submit" className="reovana-search-bar__submit" disabled={isPending}>
              {isPending ? "Searching…" : "Search"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
