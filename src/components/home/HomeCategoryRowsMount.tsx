"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HomeCategoryRows } from "@/components/home/HomeCategoryRows";
import type { PropertyListing } from "@/lib/load-category-listings";

type HomeCategoryRowsMountProps = {
  rowListings: Record<string, PropertyListing[]>;
  browseSoftGate?: boolean;
};

export function HomeCategoryRowsMount({
  rowListings,
  browseSoftGate = false,
}: HomeCategoryRowsMountProps) {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMount(document.getElementById("reovana-home-category-rows"));
  }, []);

  if (!mount) return null;

  return createPortal(
    <HomeCategoryRows rowListings={rowListings} browseSoftGate={browseSoftGate} />,
    mount,
  );
}
