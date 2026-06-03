"use client";

import { useEffect } from "react";

type TemplatePageProps = {
  html: string;
  bodyClass: string;
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

export function TemplatePage({ html, bodyClass }: TemplatePageProps) {
  useEffect(() => {
    document.body.className = normalizeBodyClass(bodyClass);

    const hideLoader = () => {
      const loading = document.getElementById("loading");
      if (loading) {
        loading.style.display = "none";
      }
      document.body.classList.remove("popup-loader");
    };

    hideLoader();
    const t = window.setTimeout(hideLoader, 800);
    return () => window.clearTimeout(t);
  }, [bodyClass, html]);

  return <div id="template-root" dangerouslySetInnerHTML={{ __html: html }} />;
}
