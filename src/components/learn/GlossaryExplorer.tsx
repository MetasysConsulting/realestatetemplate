"use client";

import { useMemo, useRef, useState } from "react";
import { LearnHeroBanner } from "@/components/learn/LearnHeroBanner";
import { GLOSSARY_TERMS } from "@/lib/learn-content";

function termId(term: string) {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function GlossaryExplorer() {
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  const letters = useMemo(() => {
    const set = new Set<string>();
    for (const t of GLOSSARY_TERMS) {
      set.add(t.term[0].toUpperCase());
    }
    return [...set].sort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q),
    );
  }, [query]);

  function jumpToLetter(letter: string) {
    const index = filtered.findIndex((t) => t.term[0].toUpperCase() === letter);
    const el = listRef.current?.children[index];
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <>
      <LearnHeroBanner
        kicker="Learn › Glossary"
        title="Foreclosure & Auction Glossary"
        description="The vocabulary of distressed real estate, explained simply. These definitions are general education — always confirm specifics for your state."
      >
        <form
          className="learn-search-bar"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="search"
            placeholder="Search terms…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </LearnHeroBanner>

      <div className="learn-page learn-page--body">
        <div className="tf-container">
          <div className="learn-alpha" role="navigation" aria-label="Jump to letter">
            {letters.map((letter) => (
              <button key={letter} type="button" onClick={() => jumpToLetter(letter)}>
                {letter}
              </button>
            ))}
          </div>

          <div className="learn-glossary-list" ref={listRef}>
            {filtered.map((item) => (
              <article key={item.term} className="learn-glossary-item" id={termId(item.term)}>
                <div className="learn-glossary-item__head">
                  <h2>{item.term}</h2>
                  {item.pill ? <span className="learn-tag">{item.pill}</span> : null}
                </div>
                <p>{item.definition}</p>
              </article>
            ))}
            {filtered.length === 0 ? (
              <p className="learn-empty">No terms match your search.</p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
