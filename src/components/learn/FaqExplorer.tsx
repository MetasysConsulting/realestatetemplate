"use client";

import { useState } from "react";
import { LearnHeroBanner } from "@/components/learn/LearnHeroBanner";
import { FAQ_ITEMS } from "@/lib/learn-content";

export function FaqExplorer() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <LearnHeroBanner
        kicker="Learn › FAQ"
        title="Frequently asked questions"
        description="Quick answers about how REOVANA works, our data, and getting started."
      />

      <div className="learn-page learn-page--body">
        <div className="tf-container">
          <div className="learn-faq">
            {FAQ_ITEMS.map((item, index) => {
              const open = openIndex === index;
              return (
                <div key={item.question} className={`learn-faq-item${open ? " open" : ""}`}>
                  <button
                    type="button"
                    className="learn-faq-item__q"
                    aria-expanded={open}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    {item.question}
                    <span className="learn-faq-item__plus" aria-hidden>
                      +
                    </span>
                  </button>
                  <div className="learn-faq-item__a">
                    <p>{item.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
