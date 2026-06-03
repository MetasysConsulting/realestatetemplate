"use client";

import Link from "next/link";
import { useState } from "react";

export function HeroSearch() {
  const [listingType, setListingType] = useState<"sale" | "rent">("sale");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="page-title home01">
      <div className="tf-container">
        <div className="row justify-center relative">
          <div className="col-lg-8">
            <div className="content-inner">
              <div className="heading-title">
                <h1 className="title">Search Luxury Homes</h1>
                <p className="h6 fw-4">
                  Discover premium properties across Hawaii — from oceanfront
                  villas to downtown penthouses.
                </p>
              </div>
              <div className="wg-filter">
                <div className="form-title">
                  <div className="tf-dropdown-sort">
                    <button
                      type="button"
                      className="btn-select"
                      onClick={() =>
                        setListingType((t) => (t === "sale" ? "rent" : "sale"))
                      }
                    >
                      <span className="text-sort-value">
                        {listingType === "sale" ? "For sale" : "For rent"}
                      </span>
                      <i className="icon-CaretDown" />
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <fieldset>
                      <input
                        type="text"
                        placeholder="Place, neighborhood, school or agent..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </fieldset>
                  </form>
                  <div className="box-item wrap-btn">
                    <button
                      type="button"
                      className="btn-filter show-form"
                      onClick={() => setFiltersOpen((o) => !o)}
                      aria-expanded={filtersOpen}
                    >
                      <div className="icons">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M21 4H14"
                            stroke="var(--Primary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 4H3"
                            stroke="var(--Primary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 12H12"
                            stroke="var(--Primary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8 12H3"
                            stroke="var(--Primary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 20H16"
                            stroke="var(--Primary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 20H3"
                            stroke="var(--Primary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </button>
                    <Link
                      href={`/properties?type=${listingType}&q=${encodeURIComponent(query)}`}
                      className="tf-btn bg-color-primary pd-3"
                    >
                      Search <i className="icon-MagnifyingGlass fw-6" />
                    </Link>
                  </div>
                </div>
                {filtersOpen && (
                  <div className="wd-search-form" style={{ display: "block" }}>
                    <div className="group-select">
                      <div className="box-select">
                        <select className="nice-select" defaultValue="hi">
                          <option value="hi">Hawaii</option>
                          <option value="oahu">Oahu</option>
                          <option value="maui">Maui</option>
                        </select>
                      </div>
                      <div className="box-select">
                        <select className="nice-select" defaultValue="3">
                          <option value="1">1+ Beds</option>
                          <option value="2">2+ Beds</option>
                          <option value="3">3+ Beds</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
