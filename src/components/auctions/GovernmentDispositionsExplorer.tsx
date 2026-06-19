"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatGsaScrapedDate,
  formatGsaSqFt,
  getGsaFilterOptions,
  type GsaDispositionListing,
  type GsaDispositionStatus,
} from "@/lib/gsa-dispositions";
import { AuctionsMap } from "@/components/auctions/AuctionsMap";
import { AuctionsMapToolbar } from "@/components/auctions/AuctionsMapToolbar";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import { auctionPropertyDetailPath } from "@/lib/property-categories";

function statusClass(status: GsaDispositionStatus): string {
  if (status === "SOLD") return "gsa-status gsa-status--sold";
  if (status === "UNDER CONTRACT") return "gsa-status gsa-status--contract";
  return "gsa-status gsa-status--available";
}

function GsaPropertyCard({ listing }: { listing: GsaDispositionListing }) {
  const [imageUrl, setImageUrl] = useState(listing.displayImageUrl);

  return (
    <article className="auctions-card gsa-card">
      <div className="auctions-card__media">
        <div className="auctions-card__thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${listing.title}, ${listing.city}, ${listing.state}`}
            className="auctions-card__photo"
            loading="lazy"
            decoding="async"
            onError={() => setImageUrl(DEFAULT_AUCTION_PROPERTY_IMAGE)}
          />
        </div>
        {listing.status === "Available" ? (
          <span className="auctions-card__badge">GSA</span>
        ) : null}
      </div>
      <div className="auctions-card__body">
        <p className="auctions-card__bid-label">Federal Disposition</p>
        <h3 className="auctions-card__address gsa-card__title">{listing.title}</h3>
        <div className="auctions-card__tags">
          <span className="auctions-card__tag">{listing.propertyType}</span>
          <span className="auctions-card__tag">Government</span>
        </div>
        <p className="auctions-card__category">
          {listing.address}, {listing.city}, {listing.state} {listing.zip}
        </p>
        <ul className="auctions-card__specs">
          <li>{formatGsaSqFt(listing.rentableSqFt)}</li>
        </ul>
        <p className="auctions-card__datetime">Listed {listing.dateListed}</p>
        <div className="auctions-card__footer">
          <span className={statusClass(listing.status)}>{listing.status}</span>
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

function toMapProperties(listings: GsaDispositionListing[]): AuctionProperty[] {
  return listings.map((l) => ({
    id: l.id,
    isNew: false,
    openingBid: 0,
    tags: ["Government"],
    category: "Government Disposition",
    buyType: "commercial",
    address: l.title,
    city: l.city,
    state: l.state,
    zip: l.zip,
    beds: 0,
    baths: 0,
    sqft: l.rentableSqFt,
    auctionDate: l.dateListed,
    auctionTime: "",
    status: l.status,
    lat: l.lat,
    lng: l.lng,
    imageUrl: l.displayImageUrl,
    detailUrl: auctionPropertyDetailPath(l.id),
  }));
}

type GovernmentDispositionsExplorerProps = {
  listings: GsaDispositionListing[];
  scrapedAt: string;
  sourceUrl: string;
};

export function GovernmentDispositionsExplorer({
  listings,
  scrapedAt,
  sourceUrl,
}: GovernmentDispositionsExplorerProps) {
  const [status, setStatus] = useState("All");
  const [propertyType, setPropertyType] = useState("All");
  const [state, setState] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [mapView, setMapView] = useState<"map" | "satellite">("map");
  const [layersOpen, setLayersOpen] = useState(false);

  const filterOptions = useMemo(() => getGsaFilterOptions(listings), [listings]);

  const filtered = useMemo(() => {
    const result = listings.filter((l) => {
      if (status !== "All" && l.status !== status) return false;
      if (propertyType !== "All" && l.propertyType !== propertyType) return false;
      if (state !== "All" && l.state !== state) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "sqft-desc") return b.rentableSqFt - a.rentableSqFt;
      if (sortBy === "sqft-asc") return a.rentableSqFt - b.rentableSqFt;
      return new Date(b.dateListed).getTime() - new Date(a.dateListed).getTime();
    });
  }, [listings, status, propertyType, state, sortBy]);

  const clearFilters = () => {
    setStatus("All");
    setPropertyType("All");
    setState("All");
  };

  return (
    <div className="auctions-page">
      <div className="auctions-toolbar">
        <div className="auctions-toolbar__filters">
          <label className="auctions-filter">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All</option>
              {filterOptions.statuses.map((s) => (
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
        </div>
        <div className="auctions-toolbar__actions">
          <button type="button" className="auctions-link-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="auctions-layout">
        <section className="auctions-list-panel" aria-label="Government disposition properties">
          <div className="auctions-list-head">
            <h1>Government Disposition</h1>
            <p>
              Showing <strong>{filtered.length}</strong> of <strong>{listings.length}</strong>{" "}
              federal properties identified for accelerated disposition
            </p>
            <div className="gsa-attribution">
              <p>
                Data sourced from the{" "}
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  U.S. General Services Administration
                </a>
                . Last updated {formatGsaScrapedDate(scrapedAt)}.
              </p>
            </div>
            <div className="auctions-list-head__actions">
              <label className="auctions-sort">
                Sort by
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="date">Date Listed</option>
                  <option value="sqft-desc">Size: Largest</option>
                  <option value="sqft-asc">Size: Smallest</option>
                </select>
              </label>
            </div>
          </div>
          <div className="auctions-list">
            {filtered.map((listing) => (
              <GsaPropertyCard key={listing.id} listing={listing} />
            ))}
            {filtered.length === 0 ? (
              <p className="auctions-empty">No properties match your filters.</p>
            ) : null}
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
