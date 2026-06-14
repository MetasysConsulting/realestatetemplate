"use client";

import Link from "next/link";
import {
  LOAN_FEATURES,
  LOAN_SOLUTIONS,
} from "@/lib/loans-content";

function LoanIcon({ type }: { type: string }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15V9" />
          <path d="M12 17V7" />
          <path d="M16 13v-2" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
      );
    case "flip":
      return (
        <svg {...common}>
          <path d="M3 12h18" />
          <path d="M7 8l-4 4 4 4" />
          <path d="M17 8l4 4-4 4" />
        </svg>
      );
    case "rental":
      return (
        <svg {...common}>
          <path d="M4 10l8-6 8 6v10H4z" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "construction":
      return (
        <svg {...common}>
          <path d="M4 20h16" />
          <path d="M7 20V9l5-4 5 4v11" />
          <path d="M10 13h4" />
        </svg>
      );
    case "commercial":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 8h2v2H9zM13 8h2v2h-2zM9 12h2v2H9zM13 12h2v2h-2z" />
        </svg>
      );
    case "bridge":
      return (
        <svg {...common}>
          <path d="M4 16h16" />
          <path d="M6 16V10l6-4 6 4v6" />
        </svg>
      );
    case "auction":
      return (
        <svg {...common}>
          <path d="M14 4l6 6-8 8H6v-6l8-8z" />
          <path d="M13 5l6 6" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="M4 11l8-7 8 7" />
          <path d="M6 10v10h12V10" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="1" />
          <path d="M9 7h2v2H9zM13 7h2v2h-2zM9 11h2v2H9zM13 11h2v2h-2z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

export function LoansPageContent() {
  return (
    <div className="loans-page">
      <section className="loans-hero">
        <div className="loans-hero__overlay" aria-hidden="true" />
        <div className="tf-container loans-hero__inner">
          <div className="loans-hero__copy">
            <p className="loans-hero__eyebrow">
              Connecting Real Estate Investors with Hard Money Lenders Nationwide
            </p>
            <h1>
              Find Investor &amp; Hard Money Loans for{" "}
              <span className="loans-hero__accent">Distressed Properties</span>
            </h1>
            <p className="loans-hero__lead">
              REOVANA.com connects real estate investors with private lenders and offers
              fast funding solutions for distressed property deals.
            </p>

            <div className="loans-hero__actions">
              <Link href="/contact" className="loans-btn loans-btn--primary">
                Find a Loan — Get Matched with Lenders
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/properties/foreclosure" className="loans-btn loans-btn--secondary">
                Browse Distressed Properties
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <aside className="loans-calculator-card">
            <h2>Loan Calculator</h2>
            <p>Estimate your loan payments in seconds.</p>

            <div className="loans-calculator-card__option">
              <div className="loans-calculator-card__icon loans-calculator-card__icon--blue">
                <LoanIcon type="home" />
              </div>
              <div>
                <h3>Residential Loan Calculator</h3>
                <p>Estimate payments for fix &amp; flip, rental, and bridge loans.</p>
                <Link href="/" className="loans-calculator-card__cta loans-calculator-card__cta--blue">
                  Calculate Now
                </Link>
              </div>
            </div>

            <div className="loans-calculator-card__option">
              <div className="loans-calculator-card__icon loans-calculator-card__icon--accent">
                <LoanIcon type="building" />
              </div>
              <div>
                <h3>Commercial Loan Calculator</h3>
                <p>Model terms for office, retail, and mixed-use investments.</p>
                <Link href="/auctions/commercial" className="loans-calculator-card__cta loans-calculator-card__cta--accent">
                  Calculate Now
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="loans-feature-bar">
        <div className="tf-container">
          <div className="loans-feature-bar__grid">
            {LOAN_FEATURES.map((feature) => (
              <div key={feature.title} className="loans-feature-bar__item">
                <div className="loans-feature-bar__icon">
                  <LoanIcon type={feature.icon} />
                </div>
                <div>
                  <strong>{feature.title}</strong>
                  <span>{feature.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="loans-solutions" id="solutions">
        <div className="tf-container">
          <div className="loans-solutions__header">
            <h2>Solutions for Real Estate Investors</h2>
            <p>
              Whether you are flipping, holding rentals, or bidding at auction, REOVANA
              helps you find the right financing for distressed property deals.
            </p>
          </div>

          <div className="loans-solutions__grid">
            {LOAN_SOLUTIONS.map((solution) => (
              <article key={solution.title} className="loans-solution-card">
                <div className="loans-solution-card__icon">
                  <LoanIcon type={solution.icon} />
                </div>
                <h3>{solution.title}</h3>
                <p>{solution.description}</p>
                <Link href="/contact" className="loans-solution-card__link">
                  Learn More <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
