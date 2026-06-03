"use client";

import { useEffect } from "react";

type TemplatePageProps = {
  html: string;
  bodyClass: string;
};

export function TemplatePage({ html, bodyClass }: TemplatePageProps) {
  useEffect(() => {
    document.body.className = bodyClass;

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
