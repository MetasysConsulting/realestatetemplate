"use client";

import { useMemo, useRef } from "react";
import { GLOSSARY_TERMS } from "@/lib/learn-content";

function termId(term: string) {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function GlossaryExplorer() {
  const listRef = useRef<HTMLDivElement>(null);

  const letters = useMemo(() => {
    const set = new Set<string>();
    for (const t of GLOSSARY_TERMS) {
      set.add(t.term[0].toUpperCase());
    }
    return [...set].sort();
  }, []);

  function jumpToLetter(letter: string) {
    const index = GLOSSARY_TERMS.findIndex((t) => t.term[0].toUpperCase() === letter);
    const el = listRef.current?.children[index];
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <div className="learn-page learn-page--body">
      <div className="tf-container">
        <p className="learn-crumb">
          Learn › <strong>Glossary</strong>
        </p>
        <div className="learn-hero learn-hero--compact">
          <h1>Foreclosure &amp; Auction Glossary</h1>
          <p className="learn-lead">
            The vocabulary of distressed real estate, explained simply. These definitions
            are general education — always confirm specifics for your state.
          </p>
        </div>

        <div className="learn-alpha" role="navigation" aria-label="Jump to letter">
          {letters.map((letter) => (
            <button key={letter} type="button" onClick={() => jumpToLetter(letter)}>
              {letter}
            </button>
          ))}
        </div>

        <div className="learn-glossary-list" ref={listRef}>
          {GLOSSARY_TERMS.map((item) => (
            <article key={item.term} className="learn-glossary-item" id={termId(item.term)}>
              <div className="learn-glossary-item__head">
                <h2>{item.term}</h2>
                {item.pill ? <span className="learn-tag">{item.pill}</span> : null}
              </div>
              <p>{item.definition}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
