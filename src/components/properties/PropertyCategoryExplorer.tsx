"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuctionsMap } from "@/components/auctions/AuctionsMap";
import { AuctionsMapToolbar } from "@/components/auctions/AuctionsMapToolbar";
import { ListingDetailLink } from "@/components/listings/ListingDetailLink";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import type { PropertyListing } from "@/lib/load-category-listings";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function PropertyCard({ listing }: { listing: PropertyListing }) {
  const [imageUrl, setImageUrl] = useState(listing.imageUrl);

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
        {listing.isNew ? <span className="auctions-card__badge">NEW</span> : null}
      </div>
      <div className="auctions-card__body">
        <p className="auctions-card__bid-label">{listing.priceLabel}</p>
        <p className="auctions-card__price">{formatPrice(listing.price)}</p>
        <div className="auctions-card__tags">
          {listing.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="auctions-card__tag">
              {tag}
            </span>
          ))}
        </div>
        {listing.subtitle ? (
          <p className="auctions-card__category">{listing.subtitle}</p>
        ) : null}
        <h3 className="auctions-card__address">
          {listing.address}, {listing.city}, {listing.state} {listing.zip}
        </h3>
        <ul className="auctions-card__specs">
          {listing.bedrooms > 0 ? <li>{listing.bedrooms} bd</li> : null}
          {listing.bathrooms > 0 ? <li>{listing.bathrooms} ba</li> : null}
          {listing.squareFootage > 0 ? (
            <li>{listing.squareFootage.toLocaleString()} sqft</li>
          ) : null}
        </ul>
        <div className="auctions-card__footer">
          <span className="hud-status">{listing.status}</span>
          <ListingDetailLink
            href={listing.detailPath}
            className="auctions-card__register tf-btn bg-color-primary"
          >
            View Details
          </ListingDetailLink>
        </div>
      </div>
    </article>
  );
}

function toMapProperties(listings: PropertyListing[]): AuctionProperty[] {
  return listings
    .filter((l) => l.lat && l.lng)
    .map((l) => ({
      id: l.id,
      isNew: l.isNew,
      openingBid: l.price,
      tags: l.tags,
      category: l.propertyType,
      buyType: "foreclosure-homes",
      address: l.address,
      city: l.city,
      state: l.state,
      zip: l.zip,
      beds: l.bedrooms,
      baths: l.bathrooms,
      sqft: l.squareFootage,
      auctionDate: "",
      auctionTime: "",
      status: l.status,
      lat: l.lat,
      lng: l.lng,
      imageUrl: l.imageUrl,
      detailUrl: l.detailPath,
    }));
}

type PropertyCategoryExplorerProps = {
  title: string;
  description: string;
  listings: PropertyListing[];
};

export function PropertyCategoryExplorer({
  title,
  description,
  listings,
}: PropertyCategoryExplorerProps) {
  const [state, setState] = useState("All");
  const [sortBy, setSortBy] = useState("price-desc");
  const [mapView, setMapView] = useState<"map" | "satellite">("map");
  const [layersOpen, setLayersOpen] = useState(false);

  const states = useMemo(
    () => [...new Set(listings.map((l) => l.state))].sort(),
    [listings],
  );

  const filtered = useMemo(() => {
    const result = listings.filter((l) => state === "All" || l.state === state);
    return [...result].sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "sqft-desc") return b.squareFootage - a.squareFootage;
      return b.price - a.price;
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
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="auctions-layout">
        <section className="auctions-list-panel" aria-label={title}>
          <div className="auctions-list-head">
            <h1>{title}</h1>
            <p>{description}</p>
            <p>
              Showing <strong>{filtered.length}</strong> of{" "}
              <strong>{listings.length}</strong> properties
            </p>
            <div className="auctions-list-head__actions">
              <label className="auctions-sort">
                Sort by
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="sqft-desc">Size: Largest</option>
                </select>
              </label>
            </div>
          </div>
          <div className="auctions-list">
            {filtered.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} />
            ))}
            {filtered.length === 0 ? (
              <p className="auctions-empty">
                {listings.length === 0
                  ? "No listings available in this category yet."
                  : "No properties match your filters."}
              </p>
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
