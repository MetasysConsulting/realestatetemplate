"use client";

import { useEffect } from "react";
import { wireTemplateAuth } from "@/lib/wire-template-auth";

export function WireTemplateAuth() {
  useEffect(() => {
    let unsubscribe = wireTemplateAuth();

    const retry = window.setTimeout(() => {
      unsubscribe?.();
      unsubscribe = wireTemplateAuth();
    }, 600);

    return () => {
      window.clearTimeout(retry);
      unsubscribe?.();
    };
  }, []);

  return null;
}
