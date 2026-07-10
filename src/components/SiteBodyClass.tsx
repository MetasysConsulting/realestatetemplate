"use client";

import { useEffect } from "react";

/** Applies public-site body classes only while the (site) tree is mounted. */
export function SiteBodyClass() {
  useEffect(() => {
    const body = document.body;
    body.classList.add("theme-color-4", "popup-loader");
    return () => {
      body.classList.remove("theme-color-4", "popup-loader");
    };
  }, []);

  return null;
}
