"use client";

import { useMemo, useState } from "react";
import { FeaturedListings } from "@/components/learn/FeaturedListings";
import { GLOSSARY_TERMS } from "@/lib/learn-content";

const CATEGORIES = ["All", "Buying", "Property Types", "Auction", "Finance"] as const;

export function GlossaryExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY_TERMS.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <div className="learn-page">
      <div className="tf-container">
        <header className="learn-hero">
          <h1>Foreclosure &amp; Auction Glossary</h1>
          <p>
            Key terms for buying distressed real estate on REOVANA — from opening bids
            to bank-owned inventory.
          </p>
        </header>

        <div className="learn-toolbar">
          <label className="learn-search">
            <span className="sr-only">Search glossary</span>
            <input
              type="search"
              placeholder="Search terms…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="learn-filter">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="learn-glossary-list">
          {filtered.map((item) => (
            <article
              key={item.term}
              className="learn-glossary-item"
              id={item.term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}
            >
              <div className="learn-glossary-item__head">
                <h2>{item.term}</h2>
                <span className="learn-tag">{item.category}</span>
              </div>
              <p>{item.definition}</p>
            </article>
          ))}
          {filtered.length === 0 ? (
            <p className="learn-empty">No terms match your search.</p>
          ) : null}
        </div>

        <FeaturedListings title="Browse auction listings" />
      </div>
    </div>
  );
}
