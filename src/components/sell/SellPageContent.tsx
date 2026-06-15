"use client";

import Link from "next/link";
import {
  SELL_HERO_FEATURES,
  SELL_OPTIONS,
  SELL_WHY_CHOOSE,
} from "@/lib/sell-content";

const HERO_HOUSE_IMAGE = "/images/reovana/loan-steps-house-distressed.png";

function SellIcon({ type }: { type: string }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "cash":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M7 6V4M17 6V4" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M14 20c0-2 1.5-3.5 4-3.5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "realtor":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
          <path d="M16 8l2-1 1 2" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M20 12l-8 8-8-8V4h8l8 8z" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "network":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="3" />
          <circle cx="16" cy="8" r="3" />
          <path d="M5 20c0-2.5 1.5-4 3-4s3 1.5 3 4M13 20c0-2.5 1.5-4 3-4s3 1.5 3 4" />
        </svg>
      );
    case "fast":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l3 2" />
          <path d="M16 3l2 2M20 3l-2 2" />
        </svg>
      );
    case "secure":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "trusted":
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="5" />
          <path d="M8 14l-2 7 6-3 6 3-2-7" />
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

export function SellPageContent() {
  return (
    <div className="sell-page">
      <section className="sell-hero">
        <div className="tf-container sell-hero__inner">
          <div className="sell-hero__copy">
            <h1>
              Ready to sell your <span className="sell-hero__accent">distressed property?</span>
            </h1>
            <p className="sell-hero__lead">
              List your <strong>distressed property</strong> on <strong>REOVANA.com</strong> and
              connect with investors, cash buyers, and real estate professionals looking for
              opportunities like yours.
            </p>

            <div className="sell-hero__features">
              {SELL_HERO_FEATURES.map((feature) => (
                <div key={feature.title} className="sell-hero__feature">
                  <div className={`sell-hero__feature-icon sell-hero__feature-icon--${feature.tone}`}>
                    <SellIcon type={feature.icon} />
                  </div>
                  <div>
                    <strong>{feature.title}</strong>
                    <span>{feature.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sell-hero__visual" aria-hidden="true">
            <div className="sell-hero__image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_HOUSE_IMAGE}
                alt=""
                className="sell-hero__house"
                loading="eager"
                decoding="async"
              />
              <div className="sell-hero__sign">
                <span className="sell-hero__sign-top">DISTRESSED PROPERTY</span>
                <span className="sell-hero__sign-bottom">SELL ON REOVANA.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sell-options">
        <div className="tf-container">
          <h2 className="sell-section-title">Choose the best way to sell your property</h2>
          <div className="sell-options__grid">
            {SELL_OPTIONS.map((option) => (
              <article
                key={option.title}
                className={`sell-option-card sell-option-card--${option.tone} sell-option-card--decor-${option.decor}`}
              >
                <div className={`sell-option-card__icon sell-option-card__icon--${option.tone}`}>
                  <SellIcon type={option.icon} />
                </div>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
                <ul className="sell-option-card__perks">
                  {option.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                {option.cta === "List My Property" ? (
                  <Link
                    href="/add-property"
                    className={`sell-btn sell-btn--${option.tone}`}
                  >
                    {option.cta}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`sell-btn sell-btn--${option.tone} reovana-cta--pending`}
                    disabled
                  >
                    {option.cta}
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sell-why">
        <div className="tf-container">
          <h2 className="sell-section-title">Why sellers choose REOVANA.com</h2>
          <div className="sell-why__grid">
            {SELL_WHY_CHOOSE.map((item) => (
              <div key={item.title} className="sell-why__item">
                <div className="sell-why__icon">
                  <SellIcon type={item.icon} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
