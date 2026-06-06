"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FAQ_ITEMS,
  FEATURED_GUIDES,
  GLOSSARY_TERMS,
  LEARN_HUB_CARDS,
  POPULAR_HELP_ARTICLES,
} from "@/lib/learn-content";

export function LearnHub() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch() {
    const q = query.trim().toLowerCase();
    if (!q) return;

    const term = GLOSSARY_TERMS.find(
      (t) =>
        t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q),
    );
    if (term) {
      router.push("/learn/glossary");
      return;
    }

    const help = POPULAR_HELP_ARTICLES.find((a) => a.label.toLowerCase().includes(q));
    if (help) {
      router.push(help.href);
      return;
    }

    const faq = FAQ_ITEMS.find(
      (f) =>
        f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q),
    );
    if (faq) {
      router.push("/learn/faq");
      return;
    }

    router.push("/learn/help-center");
  }

  return (
    <>
      <div className="learn-hero-banner">
        <div className="tf-container">
          <p className="learn-kicker">Learn</p>
          <h1>Everything you need to buy distressed property with confidence.</h1>
          <p>
            Plain-English guides, a foreclosure glossary, and answers to the questions
            buyers and sellers ask most — built for first-timers and seasoned investors
            alike.
          </p>
          <form
            className="learn-search-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <input
              type="search"
              placeholder="Search guides, terms, and help articles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </div>

      <div className="learn-page learn-page--body">
        <div className="tf-container">
          <div className="learn-hub-grid">
            {LEARN_HUB_CARDS.map((card) => (
              <Link key={card.href} href={card.href} className="learn-hub-card">
                <span className="learn-hub-card__icon" aria-hidden>
                  {card.icon}
                </span>
                <h2>{card.title}</h2>
                <p>{card.description}</p>
                <span className="learn-hub-card__go">
                  {card.title === "Glossary"
                    ? "Browse terms →"
                    : card.title === "Help Center"
                      ? "Get help →"
                      : card.title === "Blog"
                        ? "Read articles →"
                        : "See FAQs →"}
                </span>
              </Link>
            ))}
          </div>

          <section className="learn-feat">
            <h2>Featured guides</h2>
            <div className="learn-art-grid">
              {FEATURED_GUIDES.map((guide) => (
                <Link key={guide.href} href={guide.href} className="learn-art-card">
                  <div className="learn-art-card__media">
                    <Image
                      src={guide.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                    />
                  </div>
                  <div className="learn-art-card__body">
                    <span className="learn-art-card__tag">{guide.tag}</span>
                    <h3>{guide.title}</h3>
                    <p>{guide.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
