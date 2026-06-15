"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HomeCategoryRows } from "@/components/home/HomeCategoryRows";

export function HomeCategoryRowsMount() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMount(document.getElementById("reovana-home-category-rows"));
  }, []);

  if (!mount) return null;

  return createPortal(<HomeCategoryRows />, mount);
}
