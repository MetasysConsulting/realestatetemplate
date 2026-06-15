"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LoanStepsSection } from "@/components/home/LoanStepsSection";

export function LoanStepsSectionMount() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const target = document.getElementById("reovana-loan-steps-mount");
    if (target) {
      target.innerHTML = "";
      setMount(target);
    }
  }, []);

  if (!mount) return null;
  return createPortal(<LoanStepsSection />, mount);
}
