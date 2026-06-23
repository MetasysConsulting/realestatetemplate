"use client";

import Link from "next/link";
import { useState } from "react";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import { formatCurrency } from "@/lib/generate-auction-properties";
import { ListingMedia } from "@/components/listings/ListingMedia";
import {
  formatShortPrice,
  getMapLotAcres,
  getMapPreviousPrice,
} from "@/lib/map-property-popup";

type MapPropertyPopupProps = {
  property: AuctionProperty;
};

export function MapPropertyPopup({ property }: MapPropertyPopupProps) {
  const [saved, setSaved] = useState(false);

  const previousPrice = getMapPreviousPrice(property);
  const lotAcres = getMapLotAcres(property);
  const shortLabel = `${formatShortPrice(property.openingBid)} listing`;

  const specs: string[] = [];
  if (property.beds > 0) specs.push(`${property.beds} bed`);
  if (property.sqft > 0) specs.push(`${property.sqft.toLocaleString()} sqft`);

  const inner = (
    <div className="map-property-popup">
      <ListingMedia
        imageUrl={property.imageUrl}
        alt={`${property.address}, ${property.city}, ${property.state}`}
        className="map-property-popup__photo"
        imageClassName="map-property-popup__photo"
        showMissingLabel={false}
      />
      <div className="map-property-popup__shade" aria-hidden />
      <span className="map-property-popup__label">{shortLabel}</span>
      <button
        type="button"
        className={`map-property-popup__fav${saved ? " is-saved" : ""}`}
        aria-label={saved ? "Remove from saved" : "Save property"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSaved((v) => !v);
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="currentColor"
          />
        </svg>
      </button>
      <div className="map-property-popup__info">
        {previousPrice && property.openingBid > 0 ? (
          <p className="map-property-popup__was">{formatCurrency(previousPrice)}</p>
        ) : null}
        {property.openingBid > 0 ? (
          <p className="map-property-popup__price">{formatCurrency(property.openingBid)}</p>
        ) : (
          <p className="map-property-popup__price">{property.category}</p>
        )}
        {specs.length > 0 ? <p className="map-property-popup__specs">{specs.join(" ")}</p> : null}
        {lotAcres ? (
          <p className="map-property-popup__lot">{lotAcres} acres lot</p>
        ) : null}
      </div>
    </div>
  );

  if (property.detailUrl) {
    return (
      <Link href={property.detailUrl} className="map-property-popup__link">
        {inner}
      </Link>
    );
  }

  return inner;
}
