"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NeighborhoodsCarousel } from "@/components/home/NeighborhoodsCarousel";
import type { HomeNeighborhood } from "@/lib/home-neighborhoods";

type NeighborhoodsCarouselMountProps = {
  neighborhoods: HomeNeighborhood[];
};

export function NeighborhoodsCarouselMount({
  neighborhoods,
}: NeighborhoodsCarouselMountProps) {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMount(document.getElementById("reovana-neighborhoods-mount"));
  }, []);

  if (!mount || !neighborhoods.length) return null;

  return createPortal(<NeighborhoodsCarousel neighborhoods={neighborhoods} />, mount);
}
