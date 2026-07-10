"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuctionsMap } from "@/components/auctions/AuctionsMap";
import { AuctionsMapToolbar } from "@/components/auctions/AuctionsMapToolbar";
import { ListingMedia } from "@/components/listings/ListingMedia";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import {
  BROWSE_LOCKED_PRICE_DISPLAY,
  BROWSE_LOCKED_PRICE_LABEL,
  formatCardLocation,
} from "@/lib/listing-browse-redact";
import { auctionPropertyDetailPath } from "@/lib/property-categories";
import {
  formatGsaSalePrice,
  formatGsaSalesScrapedDate,
  getGsaSalesFilterOptions,
  type GsaRealEstateSale,
} from "@/lib/gsa-realestatesales";

function GsaSaleCard({ listing }: { listing: GsaRealEstateSale }) {
  const location = formatCardLocation(listing);
  const price = listing.browseLocked
    ? BROWSE_LOCKED_PRICE_DISPLAY
    : formatGsaSalePrice(listing.startingBid);

  return (
    <article className="auctions-card gsa-card">
      <div className="auctions-card__media">
        <div className="auctions-card__thumb">
          <ListingMedia
            imageUrl={listing.imageUrl}
            alt={location}
            imageClassName="auctions-card__photo"
          />
        </div>
        <span className="auctions-card__badge">GSA</span>
        {!listing.hasImage ? (
          <span className="auctions-card__badge auctions-card__badge--muted">No photo</span>
        ) : null}
      </div>
      <div className="auctions-card__body">
        <p className="auctions-card__bid-label">
          {listing.browseLocked ? BROWSE_LOCKED_PRICE_LABEL : "Starting Bid"}
        </p>
        <p className="auctions-card__price">{price}</p>
        <div className="auctions-card__tags">
          <span className="auctions-card__tag">{listing.propertyType}</span>
          <span className="auctions-card__tag">{listing.auctionType}</span>
        </div>
        <h3 className="auctions-card__address gsa-card__title">{listing.title}</h3>
        <p className="auctions-card__category">{location}</p>
        <div className="auctions-card__footer">
          <span className="gsa-status gsa-status--available">{listing.status}</span>
          <Link
            href={auctionPropertyDetailPath(listing.id)}
            className="auctions-card__register tf-btn bg-color-primary"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

function toMapProperties(listings: GsaRealEstateSale[]): AuctionProperty[] {
  return listings
    .filter((l) => l.hasRealCoordinates)
    .map((l) => ({
      id: l.id,
      isNew: false,
      openingBid: l.startingBid,
      tags: ["GSA Auction"],
      category: "Federal Property Auction",
      buyType: "commercial",
      address: l.title,
      city: l.city,
      state: l.state,
      zip: l.zip,
      browseLocked: l.browseLocked,
      beds: 0,
      baths: 0,
      sqft: 0,
      auctionDate: "",
      auctionTime: "",
      status: l.status,
      lat: l.lat,
      lng: l.lng,
      hasRealCoordinates: true,
      imageUrl: l.imageUrl,
      hasImage: l.hasImage,
      detailUrl: auctionPropertyDetailPath(l.id),
    }));
}

type GsaRealEstateSalesExplorerProps = {
  listings: GsaRealEstateSale[];
  scrapedAt: string;
  sourceUrl: string;
};

export function GsaRealEstateSalesExplorer({
  listings,
  scrapedAt,
  sourceUrl,
}: GsaRealEstateSalesExplorerProps) {
  const [state, setState] = useState("All");
  const [propertyType, setPropertyType] = useState("All");
  const [mapView, setMapView] = useState<"map" | "satellite">("map");
  const [layersOpen, setLayersOpen] = useState(false);

  const filterOptions = useMemo(() => getGsaSalesFilterOptions(listings), [listings]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (state !== "All" && l.state !== state) return false;
      if (propertyType !== "All" && l.propertyType !== propertyType) return false;
      return true;
    });
  }, [listings, state, propertyType]);

  return (
    <div className="auctions-page">
      <div className="auctions-toolbar">
        <div className="auctions-toolbar__filters">
          <label className="auctions-filter">
            <span>State</span>
            <select value={state} onChange={(e) => setState(e.target.value)}>
              <option value="All">All</option>
              {filterOptions.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="auctions-filter">
            <span>Property Type</span>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
              <option value="All">All</option>
              {filterOptions.propertyTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="auctions-layout">
        <section className="auctions-list-panel" aria-label="GSA property auctions">
          <div className="auctions-list-head">
            <h1>Federal Property Auctions</h1>
            <p>
              Showing <strong>{filtered.length}</strong> of <strong>{listings.length}</strong>{" "}
              surplus federal property auctions
            </p>
            <div className="gsa-attribution">
              <p>
                Data sourced from{" "}
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  GSA Real Estate Sales
                </a>
                . Last updated {formatGsaSalesScrapedDate(scrapedAt)}.
              </p>
            </div>
          </div>
          <div className="auctions-list">
            {filtered.map((listing) => (
              <GsaSaleCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        <section className="auctions-map-panel" aria-label="Property map">
          <AuctionsMapToolbar
            mapView={mapView}
            onMapViewChange={setMapView}
            layersOpen={layersOpen}
            onLayersOpenChange={setLayersOpen}
          />
          <div className="auctions-map-wrap">
            <AuctionsMap properties={toMapProperties(filtered)} mapView={mapView} layersPanelOpen={layersOpen} />
          </div>
        </section>
      </div>
    </div>
  );
}
