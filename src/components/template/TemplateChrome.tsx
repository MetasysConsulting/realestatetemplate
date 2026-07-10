"use client";

import { useEffect } from "react";
import { fixReovanaHeader, prepareChromeHeader } from "@/lib/fix-reovana-header";
import { normalizeTemplateHtml } from "@/lib/normalize-template-html";

type TemplateChromeProps = {
  headerHtml: string;
  footerHtml: string;
  tailHtml: string;
  bodyClass?: string;
  children: React.ReactNode;
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

export function TemplateChrome({
  headerHtml,
  footerHtml,
  tailHtml,
  bodyClass = "theme-color-4",
  children,
}: TemplateChromeProps) {
  const chromeHeaderHtml = normalizeTemplateHtml(prepareChromeHeader(headerHtml));
  const safeFooterHtml = normalizeTemplateHtml(footerHtml);
  const safeTailHtml = normalizeTemplateHtml(tailHtml);

  useEffect(() => {
    document.body.className = normalizeBodyClass(bodyClass);

    const applyHeaderFix = () => {
      const root = document.getElementById("template-chrome-root");
      if (root) fixReovanaHeader(root);
      // Let auth wiring re-apply Login vs Account after chrome DOM settles.
      window.dispatchEvent(new CustomEvent("reovana:header-fixed"));
    };

    applyHeaderFix();
    const raf = window.requestAnimationFrame(applyHeaderFix);
    const t1 = window.setTimeout(applyHeaderFix, 50);
    const t2 = window.setTimeout(applyHeaderFix, 300);
    const t3 = window.setTimeout(applyHeaderFix, 800);

    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "none";
    document.body.classList.remove("popup-loader");

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [bodyClass, chromeHeaderHtml, safeFooterHtml, safeTailHtml]);

  return (
    <div id="template-chrome-root" className="reovana-site">
      {chromeHeaderHtml ? (
        <div
          className="template-chrome-header"
          dangerouslySetInnerHTML={{ __html: chromeHeaderHtml }}
        />
      ) : null}
      {children}
      {safeFooterHtml ? (
        <div
          className="template-chrome-footer"
          dangerouslySetInnerHTML={{ __html: safeFooterHtml }}
        />
      ) : null}
      {safeTailHtml ? (
        <div
          className="template-chrome-tail"
          dangerouslySetInnerHTML={{ __html: safeTailHtml }}
        />
      ) : null}
    </div>
  );
}
