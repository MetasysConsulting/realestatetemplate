"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    n: 1,
    title: "Get pre-approved",
    body: "Get matched with hard money and private lenders who fund distressed property deals.",
    color: "green",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
        <path d="M14 3v6h6M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    n: 2,
    title: "Find a property",
    body: "Browse foreclosures, bank-owned homes, and auction listings across the country.",
    color: "amber",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v10h12V10" />
      </svg>
    ),
  },
  {
    n: 3,
    title: "Make an offer",
    body: "Confirm the deal fits your budget and move quickly with funding already in place.",
    color: "blue",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    n: 4,
    title: "Close on your investment",
    body: "Finalize your loan, complete closing, and take ownership of the property.",
    color: "indigo",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
] as const;

export function LoanStepsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="reovana-loan-steps-section"
      aria-label="Investor financing steps"
    >
      <div className="tf-container reovana-loan-steps-section__inner">
        {/* ── Left column: headline + steps ─── */}
        <div className={`reovana-loan-steps-section__copy ${visible ? "is-visible" : ""}`}>
          <div className="reovana-loan-steps__header">
            <p className="reovana-loan-steps__kicker">How it works</p>
            <h2 className="reovana-loan-steps__headline">
              Do you need a loan?
              <br />
              Get pre-approved
            </h2>
            <p className="reovana-loan-steps__lead">
              Find a lender who can offer competitive mortgage rates and help you with
              pre-approval.
            </p>
          </div>

          <ol className="reovana-loan-steps__list">
            {STEPS.map((step, i) => (
              <li
                key={step.n}
                className={`reovana-loan-steps__item${step.n === 1 ? " is-active" : ""}`}
                style={
                  visible
                    ? {
                        animation: `loanStepIn 0.5s cubic-bezier(0.22,1,0.36,1) both`,
                        animationDelay: `${0.35 + i * 0.13}s`,
                      }
                    : { opacity: 0 }
                }
              >
                <span className="reovana-loan-steps__marker" aria-hidden="true">
                  {step.n}
                </span>
                <span
                  className={`reovana-loan-steps__icon reovana-loan-steps__icon--${step.color}`}
                  aria-hidden="true"
                >
                  {step.svg}
                </span>
                <div className="reovana-loan-steps__body">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="tf-btn bg-color-primary reovana-find-lenders-btn reovana-cta--pending"
            disabled
          >
            Find lenders
          </button>
        </div>

        {/* ── Right column: house image ─── */}
        <div
          className={`reovana-loan-steps-section__media ${visible ? "is-visible" : ""}`}
        >
          <div className="reovana-loan-steps-section__img-wrap">
            <Image
              src="/images/reovana/loan-steps-house-distressed.png"
              alt="Distressed property available through REOVANA"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="reovana-loan-steps-section__img"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
