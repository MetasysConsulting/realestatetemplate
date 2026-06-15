"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NeighborhoodsCarousel } from "@/components/home/NeighborhoodsCarousel";

export function NeighborhoodsCarouselMount() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMount(document.getElementById("reovana-neighborhoods-mount"));
  }, []);

  if (!mount) return null;

  return createPortal(<NeighborhoodsCarousel />, mount);
}
