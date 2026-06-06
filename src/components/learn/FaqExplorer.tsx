"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/learn-content";

export function FaqExplorer() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="learn-page learn-page--body">
      <div className="tf-container">
        <p className="learn-crumb">
          Learn › <strong>FAQ</strong>
        </p>
        <div className="learn-hero learn-hero--compact">
          <h1>Frequently asked questions</h1>
          <p className="learn-lead">
            Quick answers about how REOVANA works, our data, and getting started.
          </p>
        </div>

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
  );
}
