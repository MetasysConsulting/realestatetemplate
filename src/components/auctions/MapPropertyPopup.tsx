"use client";

import Link from "next/link";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import { formatCurrency } from "@/lib/generate-auction-properties";
import { ListingMedia } from "@/components/listings/ListingMedia";
import {
  BROWSE_LOCKED_PRICE_DISPLAY,
  formatCardLocation,
} from "@/lib/listing-browse-redact";
import {
  formatShortPrice,
  getMapLotAcres,
  getMapPreviousPrice,
} from "@/lib/map-property-popup";

type MapPropertyPopupProps = {
  property: AuctionProperty;
  isFavorited?: boolean;
};

export function MapPropertyPopup({ property, isFavorited }: MapPropertyPopupProps) {
  const previousPrice = property.browseLocked ? null : getMapPreviousPrice(property);
  const lotAcres = getMapLotAcres(property);
  const location = formatCardLocation(property);
  const shortLabel = property.browseLocked
    ? "Unlock to view"
    : `${formatShortPrice(property.openingBid)} listing`;

  const specs: string[] = [];
  if (property.beds > 0) specs.push(`${property.beds} bed`);
  if (property.sqft > 0) specs.push(`${property.sqft.toLocaleString()} sqft`);

  const inner = (
    <div className="map-property-popup">
      <ListingMedia
        imageUrl={property.imageUrl}
        alt={location}
        className="map-property-popup__photo"
        imageClassName="map-property-popup__photo"
        showMissingLabel={false}
      />
      <div className="map-property-popup__shade" aria-hidden />
      <span className="map-property-popup__label">{shortLabel}</span>
      <FavoriteButton
        listingId={property.id}
        initialFavorited={isFavorited}
        className="map-property-popup__fav"
      />
      <div className="map-property-popup__info">
        {previousPrice && property.openingBid > 0 ? (
          <p className="map-property-popup__was">{formatCurrency(previousPrice)}</p>
        ) : null}
        {property.browseLocked ? (
          <p className="map-property-popup__price">{BROWSE_LOCKED_PRICE_DISPLAY}</p>
        ) : property.openingBid > 0 ? (
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
