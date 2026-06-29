"use client";

import { useEffect } from "react";
import { wireTemplateAuth } from "@/lib/wire-template-auth";

export function WireTemplateAuth() {
  useEffect(() => {
    let unsubscribe = wireTemplateAuth();

    const retryTimers = [600, 1500, 3000].map((delay) =>
      window.setTimeout(() => {
        unsubscribe?.();
        unsubscribe = wireTemplateAuth();
      }, delay),
    );

    return () => {
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      unsubscribe?.();
    };
  }, []);

  return null;
}
