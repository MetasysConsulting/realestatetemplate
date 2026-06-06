"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LearnHeroBanner } from "@/components/learn/LearnHeroBanner";
import { HELP_CATEGORIES, POPULAR_HELP_ARTICLES } from "@/lib/learn-content";

export function HelpCenterExplorer() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch() {
    const q = query.trim().toLowerCase();
    if (!q) return;

    const article = POPULAR_HELP_ARTICLES.find((a) => a.label.toLowerCase().includes(q));
    if (article) {
      router.push(article.href);
      return;
    }

    for (const cat of HELP_CATEGORIES) {
      const match = cat.articles.find((a) => a.label.toLowerCase().includes(q));
      if (match) {
        router.push(match.href);
        return;
      }
    }

    router.push("/learn/faq");
  }

  return (
    <>
      <LearnHeroBanner kicker="Learn › Help Center" title="How can we help?">
        <form
          className="learn-search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <input
            type="search"
            placeholder="Search help articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </LearnHeroBanner>

      <div className="learn-page learn-page--body">
        <div className="tf-container">
          <div className="learn-help-cats">
            {HELP_CATEGORIES.map((cat) => (
              <section key={cat.title} className="learn-help-cat">
                <span className="learn-help-cat__icon" aria-hidden>
                  {cat.icon}
                </span>
                <h2>{cat.title}</h2>
                <ul>
                  {cat.articles.map((article) => (
                    <li key={article.label}>
                      <Link href={article.href}>{article.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="learn-panel learn-panel--popular">
            <h2>Popular articles</h2>
            <ul className="learn-link-list">
              {POPULAR_HELP_ARTICLES.map((article) => (
                <li key={article.label}>
                  <Link href={article.href}>{article.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
