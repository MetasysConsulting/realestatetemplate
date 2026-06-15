"use client";

import { useEffect } from "react";
import { recordRecentlyViewed } from "@/lib/recently-viewed";

type RecordRecentlyViewedProps = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  priceLabel: string;
  imageUrl: string;
  detailPath: string;
};

export function RecordRecentlyViewed({
  id,
  address,
  city,
  state,
  zip,
  price,
  priceLabel,
  imageUrl,
  detailPath,
}: RecordRecentlyViewedProps) {
  useEffect(() => {
    recordRecentlyViewed({
      id,
      address,
      city,
      state,
      zip,
      price,
      priceLabel,
      imageUrl,
      detailPath,
    });
  }, [id, address, city, state, zip, price, priceLabel, imageUrl, detailPath]);

  return null;
}
