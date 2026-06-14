"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BuyCategoryKey } from "@/lib/buy-categories";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import {
  formatCurrency,
  getInventoryCount,
  type AuctionProperty,
} from "@/lib/generate-auction-properties";
import { AuctionsMap } from "@/components/auctions/AuctionsMap";
import { AuctionsMapToolbar } from "@/components/auctions/AuctionsMapToolbar";

const FILTER_OPTIONS = {
  assetType: ["All", "Foreclosure", "Bank Owned", "Short Sale", "Commercial"],
  propertyType: ["All", "Single Family", "Multi-Family", "Commercial"],
  auctionStatus: ["All", "Live Event", "Upcoming"],
  featured: ["All", "Featured Only"],
};

function PropertyCard({ property }: { property: AuctionProperty }) {
  const alt = `${property.address}, ${property.city}, ${property.state}`;
  const [imageUrl, setImageUrl] = useState(property.imageUrl);

  return (
    <article className="auctions-card">
      <div className="auctions-card__media">
        <div className="auctions-card__thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt}
            className="auctions-card__photo"
            loading="lazy"
            decoding="async"
            onError={() => setImageUrl(DEFAULT_AUCTION_PROPERTY_IMAGE)}
          />
        </div>
        {property.isNew ? <span className="auctions-card__badge">NEW</span> : null}
        <button type="button" className="auctions-card__favorite" aria-label="Save property">
          ♥
        </button>
      </div>
      <div className="auctions-card__body">
        <p className="auctions-card__bid-label">Est. Opening Bid</p>
        <p className="auctions-card__price">{formatCurrency(property.openingBid)}</p>
        <div className="auctions-card__tags">
          {property.tags.map((tag) => (
            <span key={tag} className="auctions-card__tag">
              {tag}
            </span>
          ))}
        </div>
        <p className="auctions-card__category">{property.category}</p>
        <h3 className="auctions-card__address">
          {property.address}, {property.city}, {property.state} {property.zip}
        </h3>
        <ul className="auctions-card__specs">
          {property.beds > 0 ? <li>{property.beds} bd</li> : null}
          <li>{property.baths} ba</li>
          <li>{property.sqft.toLocaleString()} sqft</li>
        </ul>
        <p className="auctions-card__datetime">
          {property.auctionDate} · {property.auctionTime}
        </p>
        <div className="auctions-card__footer">
          <span className="auctions-card__status">{property.status}</span>
          <Link href="/property/detail/v1" className="auctions-card__register tf-btn bg-color-primary">
            Register
          </Link>
        </div>
      </div>
    </article>
  );
}

type AuctionsExplorerProps = {
  pageTitle: string;
  categoryKey: BuyCategoryKey;
  properties: AuctionProperty[];
};

export function AuctionsExplorer({
  pageTitle,
  categoryKey,
  properties,
}: AuctionsExplorerProps) {
  const [assetType, setAssetType] = useState("All");
  const [propertyType, setPropertyType] = useState("All");
  const [auctionStatus, setAuctionStatus] = useState("All");
  const [featured, setFeatured] = useState("All");
  const [mapView, setMapView] = useState<"map" | "satellite">("map");
  const [layersOpen, setLayersOpen] = useState(false);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (auctionStatus !== "All" && !p.status.includes(auctionStatus)) return false;
      if (assetType !== "All" && !p.category.toLowerCase().includes(assetType.toLowerCase())) {
        return false;
      }
      if (propertyType === "Commercial" && p.beds > 0) return false;
      if (propertyType === "Single Family" && p.beds === 0) return false;
      if (featured === "Featured Only" && !p.isNew) return false;
      return true;
    });
  }, [properties, assetType, propertyType, auctionStatus, featured]);

  const inventoryCount = getInventoryCount(categoryKey, filtered.length);

  const clearFilters = () => {
    setAssetType("All");
    setPropertyType("All");
    setAuctionStatus("All");
    setFeatured("All");
  };

  return (
    <div className="auctions-page">
      <div className="auctions-toolbar">
        <div className="auctions-toolbar__filters">
          <label className="auctions-filter">
            <span>Asset Type</span>
            <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
              {FILTER_OPTIONS.assetType.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="auctions-filter">
            <span>Property Type</span>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
              {FILTER_OPTIONS.propertyType.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="auctions-filter">
            <span>Auction Status</span>
            <select value={auctionStatus} onChange={(e) => setAuctionStatus(e.target.value)}>
              {FILTER_OPTIONS.auctionStatus.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="auctions-filter">
            <span>Featured</span>
            <select value={featured} onChange={(e) => setFeatured(e.target.value)}>
              {FILTER_OPTIONS.featured.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="auctions-filter-more">
            More Filters
          </button>
        </div>
        <div className="auctions-toolbar__actions">
          <button type="button" className="auctions-link-btn" onClick={clearFilters}>
            Clear Filters
          </button>
          <button type="button" className="tf-btn bg-color-primary auctions-save-search">
            Save Search
          </button>
        </div>
      </div>

      <div className="auctions-layout">
        <section className="auctions-list-panel" aria-label="Auction properties">
          <div className="auctions-list-head">
            <h1>{pageTitle}</h1>
            <p>
              Showing <strong>{filtered.length}</strong> of{" "}
              <strong>{inventoryCount.toLocaleString()}</strong> auction properties
            </p>
            <div className="auctions-list-head__actions">
              <button type="button" className="auctions-link-btn">
                Export
              </button>
              <label className="auctions-sort">
                Sort by
                <select defaultValue="date">
                  <option value="date">Auction Date</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </label>
            </div>
          </div>
          <div className="auctions-list">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} />
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
            <AuctionsMap properties={filtered} mapView={mapView} layersPanelOpen={layersOpen} />
            <button type="button" className="auctions-map-search-area tf-btn bg-color-primary">
              Search This Area
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
