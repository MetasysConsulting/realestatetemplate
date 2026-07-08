"use client";

import { useEffect } from "react";
import { PropertyUnlockGate } from "@/components/template/PropertyUnlockGate";
import { HomeCategoryRowsMount } from "@/components/home/HomeCategoryRowsMount";
import { LoanStepsSectionMount } from "@/components/home/LoanStepsSectionMount";
import { NeighborhoodsCarouselMount } from "@/components/home/NeighborhoodsCarouselMount";
import { fixReovanaHeader } from "@/lib/fix-reovana-header";
import { normalizeTemplateHtml } from "@/lib/normalize-template-html";
import { wireTemplateSearch } from "@/lib/wire-template-search";
import type { PropertyListing } from "@/lib/load-category-listings";

type TemplatePageProps = {
  html: string;
  bodyClass: string;
  propertyGate?: boolean;
  showHomeCategoryRows?: boolean;
  showLoanSteps?: boolean;
  showNeighborhoodsCarousel?: boolean;
  homeCategoryRows?: Record<string, PropertyListing[]>;
};

function normalizeBodyClass(bodyClass: string): string {
  const classes = bodyClass
    .split(/\s+/)
    .filter(Boolean)
    .filter((c) => !/^theme-color-[123]$/.test(c));

  if (!classes.includes("theme-color-4")) {
    classes.push("theme-color-4");
  }

  return classes.join(" ");
}

export function TemplatePage({
  html,
  bodyClass,
  propertyGate = false,
  showHomeCategoryRows = false,
  showLoanSteps = false,
  showNeighborhoodsCarousel = false,
  homeCategoryRows = {},
}: TemplatePageProps) {
  const safeHtml = normalizeTemplateHtml(html);

  useEffect(() => {
    document.body.className = normalizeBodyClass(bodyClass);

    const hideLoader = () => {
      const loading = document.getElementById("loading");
      if (loading) {
        loading.style.display = "none";
      }
      document.body.classList.remove("popup-loader");
    };

    const applyHeaderFix = () => {
      const root = document.getElementById("template-root");
      if (root) fixReovanaHeader(root);
    };

    applyHeaderFix();
    const raf = window.requestAnimationFrame(applyHeaderFix);
    const t1 = window.setTimeout(applyHeaderFix, 50);
    const wireSearch = () => wireTemplateSearch();
    wireSearch();
    const tSearch1 = window.setTimeout(wireSearch, 50);
    const tSearch2 = window.setTimeout(wireSearch, 800);

    hideLoader();
    const t = window.setTimeout(hideLoader, 800);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(tSearch1);
      window.clearTimeout(tSearch2);
      window.clearTimeout(t);
    };
  }, [bodyClass, safeHtml]);

  return (
    <>
      <PropertyUnlockGate enabled={propertyGate} />
      {showHomeCategoryRows ? <HomeCategoryRowsMount rowListings={homeCategoryRows} /> : null}
      {showLoanSteps ? <LoanStepsSectionMount /> : null}
      {showNeighborhoodsCarousel ? <NeighborhoodsCarouselMount /> : null}
      <div
        id="template-root"
        className="reovana-site"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </>
  );
}
