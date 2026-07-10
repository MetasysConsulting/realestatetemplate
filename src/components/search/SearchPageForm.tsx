"use client";

import { useEffect, useEffectEvent, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  attachSearchSuggestions,
  suggestionInputValue,
} from "@/lib/attach-search-suggestions";
import type { SearchSuggestion } from "@/lib/search-suggestion-types";

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
  const [, startTransition] = useTransition();
  const qInputRef = useRef<HTMLInputElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);

  const handleSuggestionSelect = useEffectEvent((suggestion: SearchSuggestion) => {
    const qInput = qInputRef.current;
    const stateInput = stateInputRef.current;
    if (!qInput) return false;

    qInput.value = suggestionInputValue(suggestion);

    if (suggestion.type === "state" && stateInput) {
      stateInput.value = suggestion.label;
    } else if (suggestion.href.includes("state=") && stateInput) {
      const stateParam = new URL(suggestion.href, window.location.origin).searchParams.get("state");
      if (stateParam) stateInput.value = stateParam;
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

  return (
    <div className="wg-filter reovana-search-page-form" style={{ marginBottom: 18 }}>
      <div className="form-title">
        <form action="/search" method="get">
          <div className="reovana-search-page-form__row">
            <div className="reovana-search-page-form__q-wrap">
              <input
                ref={qInputRef}
                name="q"
                defaultValue={q}
                placeholder="City, address, ZIP, or property type…"
                className="reovana-search-page-form__q"
              />
            </div>
            <input
              ref={stateInputRef}
              name="state"
              defaultValue={state}
              placeholder="State (e.g. FL or Florida)"
              className="reovana-search-page-form__state"
            />
            <input
              name="propertyType"
              defaultValue={propertyType}
              placeholder="Property type (e.g. Condo)"
              className="reovana-search-page-form__type"
            />
            <input
              name="beds"
              defaultValue={beds ? String(beds) : ""}
              placeholder="Beds +"
              className="reovana-search-page-form__compact"
            />
            <input
              name="baths"
              defaultValue={baths ? String(baths) : ""}
              placeholder="Baths +"
              className="reovana-search-page-form__compact"
            />
            <input
              name="minPrice"
              defaultValue={minPrice ? String(minPrice) : ""}
              placeholder="Min $"
              className="reovana-search-page-form__price"
            />
            <input
              name="maxPrice"
              defaultValue={maxPrice ? String(maxPrice) : ""}
              placeholder="Max $"
              className="reovana-search-page-form__price"
            />
            <input type="hidden" name="pageSize" value={String(pageSize)} />
            <button type="submit" className="tf-btn bg-color-primary pd-3">
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
