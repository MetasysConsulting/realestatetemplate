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
import { bankOwnedDetailPath } from "@/lib/property-categories";
import {
  formatVrmPrice,
  formatVrmScrapedDate,
  getVrmFilterOptions,
  type VrmListing,
} from "@/lib/vrm-listings";

function VrmPropertyCard({ listing }: { listing: VrmListing }) {
  const location = formatCardLocation(listing);
  const price = listing.browseLocked
    ? BROWSE_LOCKED_PRICE_DISPLAY
    : formatVrmPrice(listing.listPrice);

  return (
    <article className="auctions-card hud-card">
      <div className="auctions-card__media">
        <div className="auctions-card__thumb">
          <ListingMedia
            imageUrl={listing.imageUrl}
            alt={location}
            imageClassName="auctions-card__photo"
          />
        </div>
        {listing.isNew ? <span className="auctions-card__badge">NEW</span> : null}
        {!listing.hasImage ? (
          <span className="auctions-card__badge auctions-card__badge--muted">No photo</span>
        ) : null}
      </div>
      <div className="auctions-card__body">
        <p className="auctions-card__bid-label">
          {listing.browseLocked ? BROWSE_LOCKED_PRICE_LABEL : "List Price"}
        </p>
        <p className="auctions-card__price">{price}</p>
        <div className="auctions-card__tags">
          <span className="auctions-card__tag">VA REO</span>
          {listing.isVendeeFinancing ? (
            <span className="auctions-card__tag">Vendee Financing</span>
          ) : null}
        </div>
        <h3 className="auctions-card__address">{location}</h3>
        <ul className="auctions-card__specs">
          {listing.bedrooms > 0 ? <li>{listing.bedrooms} bd</li> : null}
          {listing.bathrooms > 0 ? <li>{listing.bathrooms} ba</li> : null}
          {listing.squareFootage > 0 ? (
            <li>{listing.squareFootage.toLocaleString()} sqft</li>
          ) : null}
        </ul>
        <div className="auctions-card__footer">
          <span className="hud-status">{listing.status}</span>
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

function toMapProperties(listings: VrmListing[]): AuctionProperty[] {
  return listings
    .filter((l) => l.hasRealCoordinates)
    .map((l) => ({
      id: l.id,
      isNew: l.isNew,
      openingBid: l.listPrice,
      tags: ["VA REO"],
      category: "VA REO",
      buyType: "bank-owned",
      address: l.address,
      city: l.city,
      state: l.state,
      zip: l.zip,
      browseLocked: l.browseLocked,
      beds: l.bedrooms,
      baths: l.bathrooms,
      sqft: l.squareFootage,
      auctionDate: "",
      auctionTime: "",
      status: l.status,
      lat: l.lat,
      lng: l.lng,
      hasRealCoordinates: true,
      imageUrl: l.imageUrl,
      hasImage: l.hasImage,
      detailUrl: bankOwnedDetailPath(l.id),
    }));
}

type VrmPropertiesExplorerProps = {
  listings: VrmListing[];
  scrapedAt: string;
  sourceUrl: string;
};

export function VrmPropertiesExplorer({
  listings,
  scrapedAt,
  sourceUrl,
}: VrmPropertiesExplorerProps) {
  const [state, setState] = useState("All");
  const [sortBy, setSortBy] = useState("price-desc");
  const [mapView, setMapView] = useState<"map" | "satellite">("map");
  const [layersOpen, setLayersOpen] = useState(false);

  const filterOptions = useMemo(() => getVrmFilterOptions(listings), [listings]);

  const filtered = useMemo(() => {
    const result = listings.filter((l) => state === "All" || l.state === state);
    return [...result].sort((a, b) => {
      if (sortBy === "price-asc") return a.listPrice - b.listPrice;
      if (sortBy === "sqft-desc") return b.squareFootage - a.squareFootage;
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
        <section className="auctions-list-panel" aria-label="VA REO properties">
          <div className="auctions-list-head">
            <h1>VA REO Homes</h1>
            <p>
              Showing <strong>{filtered.length}</strong> of <strong>{listings.length}</strong> VA
              foreclosure listings via VRM Properties
            </p>
            <div className="gsa-attribution hud-attribution">
              <p>
                Data sourced from{" "}
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  VRM Properties
                </a>{" "}
                (official VA REO contractor). Last updated {formatVrmScrapedDate(scrapedAt)}.
              </p>
            </div>
            <div className="auctions-list-head__actions">
              <label className="auctions-sort">
                Sort by
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="sqft-desc">Size: Largest</option>
                  <option value="state">State</option>
                </select>
              </label>
            </div>
          </div>
          <div className="auctions-list">
            {filtered.map((listing) => (
              <VrmPropertyCard key={listing.id} listing={listing} />
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
