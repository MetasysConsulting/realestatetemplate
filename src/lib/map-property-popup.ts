import type { AuctionProperty } from "@/lib/generate-auction-properties";
import { formatCurrency } from "@/lib/generate-auction-properties";

export function formatShortPrice(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m >= 10 ? m.toFixed(1) : m.toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return formatCurrency(value);
}

export function getMapPreviousPrice(property: AuctionProperty): number | null {
  if (property.previousPrice && property.previousPrice > property.openingBid) {
    return property.previousPrice;
  }
  if (property.openingBid > 0) {
    return Math.round(property.openingBid * 1.04);
  }
  return null;
}

export function getMapLotAcres(property: AuctionProperty): number | null {
  if (property.lotAcres) return property.lotAcres;
  if (property.sqft > 0) {
    return Number((property.sqft / 43560 + 0.08).toFixed(2));
  }
  return null;
}
