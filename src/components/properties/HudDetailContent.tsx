"use client";

import Link from "next/link";
import { RecordRecentlyViewed } from "@/components/home/RecordRecentlyViewed";
import { ListingMedia } from "@/components/listings/ListingMedia";
import { formatHudPrice, formatHudScrapedDate, type HudListing } from "@/lib/hud-listings";
import { hudDetailPath } from "@/lib/property-categories";

type HudDetailContentProps = {
  listing: HudListing;
  scrapedAt: string;
};

export function HudDetailContent({ listing, scrapedAt }: HudDetailContentProps) {
  return (
    <div className="hud-detail-page">
      <RecordRecentlyViewed
        id={`hud-${listing.caseNumber}`}
        address={listing.address}
        city={listing.city}
        state={listing.state}
        zip={listing.zip}
        price={listing.listPrice}
        priceLabel="List Price"
        imageUrl={listing.imageUrl ?? ""}
        detailPath={hudDetailPath(listing.caseNumber)}
      />
      <div className="hud-detail-page__breadcrumb">
        <Link href="/buy/hud-home">← Back to HUD Homes</Link>
      </div>

      <div className="hud-detail-page__layout">
        <div className="hud-detail-page__media listing-detail__media">
          <ListingMedia
            imageUrl={listing.imageUrl}
            alt={`${listing.address}, ${listing.city}, ${listing.state}`}
            imageClassName="hud-detail-page__photo"
          />
        </div>

        <div className="hud-detail-page__info">
          <span className="auctions-card__badge">HUD Home</span>
          <p className="auctions-card__bid-label">List Price</p>
          <h1 className="hud-detail-page__price">{formatHudPrice(listing.listPrice)}</h1>
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
            {listing.yearBuilt ? <li>Built {listing.yearBuilt}</li> : null}
          </ul>

          <dl className="hud-detail-page__meta">
            <div>
              <dt>Case Number</dt>
              <dd>{listing.caseNumber}</dd>
            </div>
            <div>
              <dt>Property Type</dt>
              <dd>{listing.propertyType || "—"}</dd>
            </div>
            <div>
              <dt>County</dt>
              <dd>{listing.county || "—"}</dd>
            </div>
            <div>
              <dt>Listing Period</dt>
              <dd>{listing.listingPeriod || "—"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{listing.propertyStatus || "Active"}</dd>
            </div>
            <div>
              <dt>Bid Opens</dt>
              <dd>{listing.bidOpenDate || "TBD"}</dd>
            </div>
            <div>
              <dt>Bid Deadline</dt>
              <dd>{listing.periodDeadlineDate || "—"}</dd>
            </div>
            <div>
              <dt>FHA Financing</dt>
              <dd>{listing.fhaFinancing || "—"}</dd>
            </div>
            <div>
              <dt>Eligible Bidders</dt>
              <dd>{listing.eligibleBidders || "—"}</dd>
            </div>
          </dl>

          {listing.detailUrl ? (
            <a
              href={listing.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tf-btn bg-color-primary hud-detail-page__external"
            >
              View on HUDHomestore
            </a>
          ) : null}

          <p className="hud-detail-page__updated">
            Data updated {formatHudScrapedDate(scrapedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
