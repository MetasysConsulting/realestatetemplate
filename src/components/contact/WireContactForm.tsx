"use client";

import { useEffect } from "react";
import { wireContactForm } from "@/lib/wire-contact-form";

export function WireContactForm() {
  useEffect(() => {
    wireContactForm();
    const t1 = window.setTimeout(wireContactForm, 50);
    const t2 = window.setTimeout(wireContactForm, 400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return null;
}
