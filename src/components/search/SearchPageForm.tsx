"use client";

import { useEffect, useRef } from "react";
import { attachSearchSuggestions } from "@/lib/attach-search-suggestions";

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
  const qInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = qInputRef.current;
    if (!input) return;
    return attachSearchSuggestions(input);
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
