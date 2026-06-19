"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuctionsMap } from "@/components/auctions/AuctionsMap";
import { AuctionsMapToolbar } from "@/components/auctions/AuctionsMapToolbar";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import { bankOwnedDetailPath } from "@/lib/property-categories";
import {
  formatHomeStepsPrice,
  formatHomeStepsScrapedDate,
  getHomeStepsFilterOptions,
  type HomeStepsListing,
} from "@/lib/homesteps-listings";

function HomeStepsCard({ listing }: { listing: HomeStepsListing }) {
  const [imageUrl, setImageUrl] = useState(listing.displayImageUrl);

  return (
    <article className="auctions-card hud-card">
      <div className="auctions-card__media">
        <div className="auctions-card__thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${listing.address}, ${listing.city}, ${listing.state}`}
            className="auctions-card__photo"
            loading="lazy"
            decoding="async"
            onError={() => setImageUrl(DEFAULT_AUCTION_PROPERTY_IMAGE)}
          />
        </div>
        <span className="auctions-card__badge">HomeSteps</span>
      </div>
      <div className="auctions-card__body">
        <p className="auctions-card__bid-label">List Price</p>
        <p className="auctions-card__price">{formatHomeStepsPrice(listing.listPrice)}</p>
        <div className="auctions-card__tags">
          <span className="auctions-card__tag">Bank Owned</span>
          <span className="auctions-card__tag">Freddie Mac</span>
        </div>
        <h3 className="auctions-card__address">
          {listing.address}, {listing.city}, {listing.state} {listing.zip}
        </h3>
        <div className="auctions-card__footer">
          <span className="hud-status">REO</span>
          <Link
            href={bankOwnedDetailPath(listing.id)}
            className="auctions-card__register tf-btn bg-color-primary"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

function toMapProperties(listings: HomeStepsListing[]): AuctionProperty[] {
  return listings
    .filter((l) => l.lat && l.lng)
    .map((l) => ({
      id: l.id,
      isNew: false,
      openingBid: l.listPrice,
      tags: ["HomeSteps"],
      category: "Freddie Mac REO",
      buyType: "bank-owned",
      address: l.address,
      city: l.city,
      state: l.state,
      zip: l.zip,
      beds: 0,
      baths: 0,
      sqft: 0,
      auctionDate: "",
      auctionTime: "",
      status: "Available",
      lat: l.lat,
      lng: l.lng,
      imageUrl: l.displayImageUrl,
      detailUrl: bankOwnedDetailPath(l.id),
    }));
}

type HomeStepsExplorerProps = {
  listings: HomeStepsListing[];
  scrapedAt: string;
  sourceUrl: string;
};

export function HomeStepsExplorer({ listings, scrapedAt, sourceUrl }: HomeStepsExplorerProps) {
  const [state, setState] = useState("All");
  const [sortBy, setSortBy] = useState("price-desc");
  const [mapView, setMapView] = useState<"map" | "satellite">("map");
  const [layersOpen, setLayersOpen] = useState(false);

  const filterOptions = useMemo(() => getHomeStepsFilterOptions(listings), [listings]);

  const filtered = useMemo(() => {
    const result = listings.filter((l) => state === "All" || l.state === state);
    return [...result].sort((a, b) => {
      if (sortBy === "price-asc") return a.listPrice - b.listPrice;
      if (sortBy === "state") return a.state.localeCompare(b.state);
      return b.listPrice - a.listPrice;
    });
  }, [listings, state, sortBy]);

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
        </div>
      </div>

      <div className="auctions-layout">
        <section className="auctions-list-panel" aria-label="Freddie Mac HomeSteps listings">
          <div className="auctions-list-head">
            <h1>Freddie Mac HomeSteps</h1>
            <p>
              Showing <strong>{filtered.length}</strong> of <strong>{listings.length}</strong>{" "}
              Freddie Mac REO listings
            </p>
            <div className="gsa-attribution hud-attribution">
              <p>
                Data sourced from{" "}
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  Freddie Mac HomeSteps
                </a>
                . Last updated {formatHomeStepsScrapedDate(scrapedAt)}.
              </p>
            </div>
            <div className="auctions-list-head__actions">
              <label className="auctions-sort">
                Sort by
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="state">State</option>
                </select>
              </label>
            </div>
          </div>
          <div className="auctions-list">
            {filtered.map((listing) => (
              <HomeStepsCard key={listing.id} listing={listing} />
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
