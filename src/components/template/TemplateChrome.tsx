"use client";

import { useEffect } from "react";
import { fixReovanaHeader } from "@/lib/fix-reovana-header";

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
  useEffect(() => {
    document.body.className = normalizeBodyClass(bodyClass);

    const root = document.getElementById("template-chrome-root");
    if (root) fixReovanaHeader(root);

    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "none";
    document.body.classList.remove("popup-loader");
  }, [bodyClass, headerHtml, footerHtml, tailHtml]);

  return (
    <div id="template-chrome-root" className="reovana-site">
      {headerHtml ? (
        <div
          className="template-chrome-header"
          dangerouslySetInnerHTML={{ __html: headerHtml }}
        />
      ) : null}
      {children}
      {footerHtml ? (
        <div
          className="template-chrome-footer"
          dangerouslySetInnerHTML={{ __html: footerHtml }}
        />
      ) : null}
      {tailHtml ? (
        <div
          className="template-chrome-tail"
          dangerouslySetInnerHTML={{ __html: tailHtml }}
        />
      ) : null}
    </div>
  );
}
