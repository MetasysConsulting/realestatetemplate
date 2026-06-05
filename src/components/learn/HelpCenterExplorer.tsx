import Link from "next/link";
import { HELP_TOPICS } from "@/lib/learn-content";

const QUICK_LINKS = [
  { label: "All Auction Homes", href: "/auctions" },
  { label: "Foreclosure Homes", href: "/auctions/foreclosure-homes" },
  { label: "Bank Owned", href: "/auctions/bank-owned" },
  { label: "FAQ", href: "/faq" },
  { label: "Glossary", href: "/learn/glossary" },
  { label: "Contact", href: "/contact" },
];

export function HelpCenterExplorer() {
  return (
    <div className="learn-page">
      <div className="tf-container">
        <header className="learn-hero">
          <h1>Help Center</h1>
          <p>
            Guides and quick links for browsing auctions, understanding distressed
            property terms, and getting support from REOVANA.
          </p>
        </header>

        <section className="learn-card-grid" aria-label="Help topics">
          {HELP_TOPICS.map((topic) => (
            <Link key={topic.title} href={topic.href} className="learn-card">
              <span className={`learn-card__icon icon ${topic.icon}`} aria-hidden />
              <h2>{topic.title}</h2>
              <p>{topic.description}</p>
              <span className="learn-card__link">
                Learn more <i className="icon-arrow-right" />
              </span>
            </Link>
          ))}
        </section>

        <section className="learn-panel">
          <h2>Popular topics</h2>
          <ul className="learn-link-list">
            <li>
              <Link href="/faq#accordion-faq-one">How do I register for an auction?</Link>
            </li>
            <li>
              <Link href="/learn/glossary#opening-bid">What is an opening bid?</Link>
            </li>
            <li>
              <Link href="/learn/glossary#bank-owned-reo">What does bank owned (REO) mean?</Link>
            </li>
            <li>
              <Link href="/faq#accordion-faq-five">Are properties sold as-is?</Link>
            </li>
          </ul>
        </section>

        <section className="learn-panel">
          <h2>Quick links</h2>
          <div className="learn-chip-row">
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="learn-chip">
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
