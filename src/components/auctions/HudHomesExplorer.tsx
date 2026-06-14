"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuctionsMap } from "@/components/auctions/AuctionsMap";
import { hudDetailPath } from "@/lib/property-categories";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import {
  formatHudPrice,
  formatHudScrapedDate,
  getHudFilterOptions,
  type HudListing,
} from "@/lib/hud-listings";

function HudPropertyCard({ listing }: { listing: HudListing }) {
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
        <span className="auctions-card__badge">HUD</span>
      </div>
      <div className="auctions-card__body">
        <p className="auctions-card__bid-label">List Price</p>
        <p className="auctions-card__price">{formatHudPrice(listing.listPrice)}</p>
        <div className="auctions-card__tags">
          {listing.propertyType ? (
            <span className="auctions-card__tag">{listing.propertyType}</span>
          ) : null}
          {listing.listingPeriod ? (
            <span className="auctions-card__tag">{listing.listingPeriod}</span>
          ) : null}
          <span className="auctions-card__tag">HUD Home</span>
        </div>
        <p className="auctions-card__category">Case #{listing.caseNumber}</p>
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
        <p className="auctions-card__datetime">
          Bid opens {listing.bidOpenDate || "TBD"}
          {listing.periodDeadlineDate ? ` · Deadline ${listing.periodDeadlineDate}` : ""}
        </p>
        <div className="auctions-card__footer">
          <span className="hud-status">{listing.propertyStatus || "Active"}</span>
          <Link
            href={hudDetailPath(listing.caseNumber)}
            className="auctions-card__register tf-btn bg-color-primary"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

function toMapProperties(listings: HudListing[]): AuctionProperty[] {
  return listings
    .filter((l) => l.lat && l.lng)
    .map((l) => ({
      id: l.id,
      isNew: false,
      openingBid: l.listPrice,
      tags: ["HUD"],
      category: "HUD Homes",
      buyType: "foreclosure-homes",
      address: l.address,
      city: l.city,
      state: l.state,
      zip: l.zip,
      beds: l.bedrooms,
      baths: l.bathrooms,
      sqft: l.squareFootage,
      auctionDate: l.bidOpenDate,
      auctionTime: "",
      status: l.propertyStatus,
      lat: l.lat,
      lng: l.lng,
      imageUrl: l.displayImageUrl,
      detailUrl: hudDetailPath(l.caseNumber),
    }));
}

type HudHomesExplorerProps = {
  listings: HudListing[];
  scrapedAt: string;
};

export function HudHomesExplorer({ listings, scrapedAt }: HudHomesExplorerProps) {
  const [state, setState] = useState("All");
  const [propertyType, setPropertyType] = useState("All");
  const [listingPeriod, setListingPeriod] = useState("All");
  const [sortBy, setSortBy] = useState("price-desc");
  const [mapView, setMapView] = useState<"map" | "satellite">("map");

  const filterOptions = useMemo(() => getHudFilterOptions(listings), [listings]);

  const filtered = useMemo(() => {
    const result = listings.filter((l) => {
      if (state !== "All" && l.state !== state) return false;
      if (propertyType !== "All" && l.propertyType !== propertyType) return false;
      if (listingPeriod !== "All" && l.listingPeriod !== listingPeriod) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price-asc") return a.listPrice - b.listPrice;
      if (sortBy === "price-desc") return b.listPrice - a.listPrice;
      if (sortBy === "sqft-desc") return b.squareFootage - a.squareFootage;
      if (sortBy === "bid-date") {
        return new Date(b.bidOpenDate).getTime() - new Date(a.bidOpenDate).getTime();
      }
      return a.state.localeCompare(b.state);
    });
  }, [listings, state, propertyType, listingPeriod, sortBy]);

  const clearFilters = () => {
    setState("All");
    setPropertyType("All");
    setListingPeriod("All");
  };

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
          <label className="auctions-filter">
            <span>Listing Period</span>
            <select value={listingPeriod} onChange={(e) => setListingPeriod(e.target.value)}>
              <option value="All">All</option>
              {filterOptions.listingPeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
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
        <section className="auctions-list-panel" aria-label="HUD homes for sale">
          <div className="auctions-list-head">
            <h1>HUD Homes</h1>
            <p>
              Showing <strong>{filtered.length}</strong> of <strong>{listings.length}</strong> HUD
              foreclosure listings nationwide
            </p>
            <div className="gsa-attribution hud-attribution">
              <p>
                {listings.length.toLocaleString()} HUD homes hosted on REOVANA. Last updated{" "}
                {formatHudScrapedDate(scrapedAt)}. Bids require a HUD-registered broker.
              </p>
            </div>
            <div className="auctions-list-head__actions">
              <label className="auctions-sort">
                Sort by
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="sqft-desc">Size: Largest</option>
                  <option value="bid-date">Bid Open Date</option>
                </select>
              </label>
            </div>
          </div>
          <div className="auctions-list">
            {filtered.map((listing) => (
              <HudPropertyCard key={listing.id} listing={listing} />
            ))}
            {filtered.length === 0 ? (
              <p className="auctions-empty">No properties match your filters.</p>
            ) : null}
          </div>
        </section>

        <section className="auctions-map-panel" aria-label="Property map">
          <div className="auctions-map-toolbar">
            <div className="auctions-map-toggle">
              <button
                type="button"
                className={mapView === "map" ? "is-active" : ""}
                onClick={() => setMapView("map")}
              >
                Map
              </button>
              <button
                type="button"
                className={mapView === "satellite" ? "is-active" : ""}
                onClick={() => setMapView("satellite")}
              >
                Satellite
              </button>
            </div>
          </div>
          <div className="auctions-map-wrap">
            <AuctionsMap properties={toMapProperties(filtered)} mapView={mapView} />
          </div>
        </section>
      </div>
    </div>
  );
}
