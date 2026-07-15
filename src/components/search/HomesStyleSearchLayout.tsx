"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AuctionsMap } from "@/components/auctions/AuctionsMap";
import { AuctionsMapToolbar } from "@/components/auctions/AuctionsMapToolbar";
import { ListingDetailLink } from "@/components/listings/ListingDetailLink";
import { ListingMedia } from "@/components/listings/ListingMedia";
import { SearchPageForm } from "@/components/search/SearchPageForm";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import {
  BROWSE_LOCKED_PRICE_DISPLAY,
  BROWSE_LOCKED_PRICE_LABEL,
  formatCardLocation,
  formatCardPrice,
} from "@/lib/listing-browse-redact";
import type { PropertyListing } from "@/lib/load-category-listings";
import { normalizeTemplateHtml } from "@/lib/normalize-template-html";

export type SearchFilterValues = {
  q: string;
  state: string;
  propertyType: string;
  beds: number;
  baths: number;
  minPrice: number;
  maxPrice: number;
  pageSize: number;
};

type HomesStyleSearchLayoutProps = {
  title: string;
  description: string;
  filters: SearchFilterValues;
  initialListings: PropertyListing[];
  totalCount?: number;
  footerHtml: string;
  emptyMessage?: string;
};

function PropertyCard({ listing }: { listing: PropertyListing }) {
  const location = formatCardLocation(listing);
  const priceLabel = listing.browseLocked ? BROWSE_LOCKED_PRICE_LABEL : listing.priceLabel;
  const price = listing.browseLocked
    ? BROWSE_LOCKED_PRICE_DISPLAY
    : formatCardPrice(listing.price);

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
        <p className="auctions-card__bid-label">{priceLabel}</p>
        <p className="auctions-card__price">{price}</p>
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
    .filter((l) => l.hasRealCoordinates)
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
      detailUrl: l.detailPath,
    }));
}

function filtersToQuery(filters: SearchFilterValues, page: number): string {
  const next = new URLSearchParams();
  if (filters.q) next.set("q", filters.q);
  if (filters.state) next.set("state", filters.state);
  if (filters.propertyType) next.set("propertyType", filters.propertyType);
  if (filters.beds) next.set("beds", String(filters.beds));
  if (filters.baths) next.set("baths", String(filters.baths));
  if (filters.minPrice) next.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) next.set("maxPrice", String(filters.maxPrice));
  if (filters.pageSize !== 40) next.set("pageSize", String(filters.pageSize));
  next.set("page", String(page));
  return next.toString();
}

function mergeUnique(
  current: PropertyListing[],
  incoming: PropertyListing[],
): PropertyListing[] {
  const seen = new Set(current.map((l) => l.id));
  const merged = [...current];
  for (const listing of incoming) {
    if (seen.has(listing.id)) continue;
    seen.add(listing.id);
    merged.push(listing);
  }
  return merged;
}

export function HomesStyleSearchLayout({
  title,
  description,
  filters,
  initialListings,
  totalCount,
  footerHtml,
  emptyMessage = "No properties match your search yet. Try a different city, state, or filter.",
}: HomesStyleSearchLayoutProps) {
  const [listings, setListings] = useState(initialListings);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(totalCount);
  const [sortBy, setSortBy] = useState("price-desc");
  const [mapView, setMapView] = useState<"map" | "satellite">("map");
  const [layersOpen, setLayersOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(() => {
    if (typeof totalCount === "number") return initialListings.length < totalCount;
    return initialListings.length >= filters.pageSize;
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listScrollRef = useRef<HTMLElement | null>(null);
  const loadingRef = useRef(false);
  const safeFooterHtml = normalizeTemplateHtml(footerHtml);

  // Reset when server sends a new first page (filter change / navigation).
  useEffect(() => {
    setListings(initialListings);
    setPage(1);
    setTotal(totalCount);
    setLoadError(null);
    setHasMore(
      typeof totalCount === "number"
        ? initialListings.length < totalCount
        : initialListings.length >= filters.pageSize,
    );
  }, [initialListings, totalCount, filters.pageSize]);

  const sorted = useMemo(() => {
    return [...listings].sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "sqft-desc") return b.squareFootage - a.squareFootage;
      return b.price - a.price;
    });
  }, [listings, sortBy]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);
    setLoadError(null);

    const nextPage = page + 1;
    try {
      const qs = filtersToQuery(filters, nextPage);
      const res = await fetch(`/api/search/listings?${qs}`, {
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as {
        listings?: PropertyListing[];
        total?: number | null;
        error?: string;
      };

      if (!res.ok) {
        setLoadError(data.error || "Could not load more listings.");
        return;
      }

      const incoming = Array.isArray(data.listings) ? data.listings : [];
      const nextTotal = typeof data.total === "number" ? data.total : total;

      setListings((prev) => {
        const merged = mergeUnique(prev, incoming);
        if (typeof nextTotal === "number") {
          setHasMore(merged.length < nextTotal && incoming.length > 0);
        } else {
          setHasMore(incoming.length >= filters.pageSize);
        }
        return merged;
      });
      if (typeof nextTotal === "number") setTotal(nextTotal);
      setPage(nextPage);
      if (incoming.length === 0) setHasMore(false);
    } catch {
      setLoadError("Network error loading more listings.");
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [filters, hasMore, page, total]);

  useEffect(() => {
    const node = sentinelRef.current;
    const root = listScrollRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { root, rootMargin: "320px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, sorted.length]);

  const showingCount = sorted.length;
  const totalLabel = typeof total === "number" ? total : showingCount;

  return (
    <div className="search-map-layout">
      <section className="search-map-list" aria-label={title} ref={listScrollRef}>
        <div className="search-map-list__inner">
          <div className="search-map-list__filters">
            <SearchPageForm {...filters} />
          </div>

          <div className="search-map-list__head">
            <h1>{title}</h1>
            <p>{description}</p>
            <p>
              Showing <strong>{showingCount}</strong> of <strong>{totalLabel}</strong> properties
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

          <div className="search-map-list__cards">
            {sorted.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} />
            ))}
            {sorted.length === 0 ? <p className="auctions-empty">{emptyMessage}</p> : null}

            <div ref={sentinelRef} className="search-map-list__sentinel" aria-hidden="true" />

            {loadingMore ? (
              <p className="search-map-list__status">Loading more listings…</p>
            ) : null}
            {loadError ? <p className="search-map-list__status search-map-list__status--error">{loadError}</p> : null}
            {!hasMore && sorted.length > 0 ? (
              <p className="search-map-list__status">End of results</p>
            ) : null}
          </div>

          {safeFooterHtml ? (
            <div
              className="search-map-list__footer template-chrome-footer"
              dangerouslySetInnerHTML={{ __html: safeFooterHtml }}
            />
          ) : null}
        </div>
      </section>

      <section className="search-map-panel" aria-label="Property map">
        <AuctionsMapToolbar
          mapView={mapView}
          onMapViewChange={setMapView}
          layersOpen={layersOpen}
          onLayersOpenChange={setLayersOpen}
        />
        <div className="search-map-panel__wrap">
          <AuctionsMap
            properties={toMapProperties(sorted)}
            mapView={mapView}
            layersPanelOpen={layersOpen}
          />
        </div>
      </section>
    </div>
  );
}
