"use client";

import Link from "next/link";
import { useState } from "react";
import { RecordRecentlyViewed } from "@/components/home/RecordRecentlyViewed";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import { formatHudPrice, formatHudScrapedDate } from "@/lib/hud-listings";
import type { PropertyListing } from "@/lib/load-category-listings";

type ListingDetailContentProps = {
  listing: PropertyListing;
  categoryLabel: string;
  backHref: string;
  scrapedAt?: string;
  sourceAgency?: string;
};

export function ListingDetailContent({
  listing,
  categoryLabel,
  backHref,
  scrapedAt,
  sourceAgency,
}: ListingDetailContentProps) {
  const [imageUrl, setImageUrl] = useState(listing.imageUrl ?? DEFAULT_AUCTION_PROPERTY_IMAGE);
  const priceDisplay =
    listing.price > 0 ? formatHudPrice(listing.price) : listing.status === "Coming Soon" ? "Coming Soon" : "Contact for price";

  return (
    <div className="hud-detail-page">
      <RecordRecentlyViewed
        id={listing.id}
        address={listing.address}
        city={listing.city}
        state={listing.state}
        zip={listing.zip}
        price={listing.price}
        priceLabel={listing.priceLabel}
        imageUrl={listing.imageUrl}
        detailPath={listing.detailPath}
      />
      <div className="hud-detail-page__breadcrumb">
        <Link href={backHref}>← Back to {categoryLabel}</Link>
      </div>

      <div className="hud-detail-page__layout">
        <div className="hud-detail-page__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${listing.address}, ${listing.city}, ${listing.state}`}
            className="hud-detail-page__photo"
            onError={() => setImageUrl(DEFAULT_AUCTION_PROPERTY_IMAGE)}
          />
        </div>

        <div className="hud-detail-page__info">
          <span className="auctions-card__badge">{categoryLabel}</span>
          <p className="auctions-card__bid-label">{listing.priceLabel}</p>
          <h1 className="hud-detail-page__price">{priceDisplay}</h1>
          <h2 className="hud-detail-page__address">
            {listing.address}
            <br />
            {listing.city}, {listing.state} {listing.zip}
          </h2>

          <ul className="auctions-card__specs hud-detail-page__specs">
            {listing.bedrooms > 0 ? <li>{listing.bedrooms} bedrooms</li> : null}
            {listing.bathrooms > 0 ? <li>{listing.bathrooms} bathrooms</li> : null}
            {listing.squareFootage > 0 ? (
              <li>{listing.squareFootage.toLocaleString()} sq ft</li>
            ) : null}
          </ul>

          <dl className="hud-detail-page__meta">
            {listing.subtitle ? (
              <div>
                <dt>Listing</dt>
                <dd>{listing.subtitle}</dd>
              </div>
            ) : null}
            <div>
              <dt>Property Type</dt>
              <dd>{listing.propertyType || "—"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{listing.status || "Active"}</dd>
            </div>
            {listing.tags.length ? (
              <div>
                <dt>Tags</dt>
                <dd>{listing.tags.join(", ")}</dd>
              </div>
            ) : null}
            {sourceAgency ? (
              <div>
                <dt>Source Agency</dt>
                <dd>{sourceAgency}</dd>
              </div>
            ) : null}
          </dl>

          <div className="hud-detail-page__actions">
            <Link href="/contact" className="tf-btn bg-color-primary hud-detail-page__cta">
              Register Interest
            </Link>
          </div>

          {scrapedAt ? (
            <p className="hud-detail-page__disclaimer">
              Listing data last updated {formatHudScrapedDate(scrapedAt)}. REOVANA hosts this
              inventory for your convenience.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
