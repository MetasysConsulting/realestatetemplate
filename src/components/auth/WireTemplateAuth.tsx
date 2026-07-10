"use client";

import { useEffect } from "react";
import { wireTemplateAuth } from "@/lib/wire-template-auth";

export function WireTemplateAuth() {
  useEffect(() => {
    let unsubscribe = wireTemplateAuth();

    const rewire = () => {
      unsubscribe?.();
      unsubscribe = wireTemplateAuth();
    };

    const retryTimers = [600, 1500, 3000].map((delay) => window.setTimeout(rewire, delay));
    window.addEventListener("reovana:header-fixed", rewire);

    return () => {
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("reovana:header-fixed", rewire);
      unsubscribe?.();
    };
  }, []);

  return null;
}
