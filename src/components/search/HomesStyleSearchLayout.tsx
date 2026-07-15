"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AuctionsMap } from "@/components/auctions/AuctionsMap";
import { AuctionsMapToolbar } from "@/components/auctions/AuctionsMapToolbar";
import { ListingDetailLink } from "@/components/listings/ListingDetailLink";
import { ListingMedia } from "@/components/listings/ListingMedia";
import {
  SearchPageForm,
  countActiveSearchFilters,
} from "@/components/search/SearchPageForm";
import {
  attachSearchSuggestions,
  suggestionInputValue,
} from "@/lib/attach-search-suggestions";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import {
  BROWSE_LOCKED_PRICE_DISPLAY,
  BROWSE_LOCKED_PRICE_LABEL,
  formatCardLocation,
  formatCardPrice,
} from "@/lib/listing-browse-redact";
import type { PropertyListing } from "@/lib/load-category-listings";
import {
  appendMapBoundsParams,
  mapBoundsKey,
  type MapBounds,
} from "@/lib/map-bounds";
import { normalizeTemplateHtml } from "@/lib/normalize-template-html";
import { buildNormalizedSearchHref } from "@/lib/search-query";
import type { SearchSuggestion } from "@/lib/search-suggestion-types";
import { stateNameForAbbr } from "@/lib/us-states";

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

const LIST_PCT_STORAGE_KEY = "reovana_search_list_pct_v2";
const LIST_PCT_DEFAULT = 50;
const LIST_PCT_MIN = 28;
const LIST_PCT_MAX = 72;

function PropertyCard({ listing }: { listing: PropertyListing }) {
  const location = formatCardLocation(listing);
  const priceMissing = !listing.browseLocked && !(listing.price > 0);
  const priceLabel = listing.browseLocked
    ? BROWSE_LOCKED_PRICE_LABEL
    : priceMissing
      ? "Price TBD"
      : listing.priceLabel;
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

function filtersToQuery(
  filters: SearchFilterValues,
  page: number,
  bounds?: MapBounds | null,
): string {
  const next = new URLSearchParams();
  if (filters.q) next.set("q", filters.q);
  if (filters.state) next.set("state", filters.state);
  if (filters.propertyType) next.set("propertyType", filters.propertyType);
  if (filters.beds) next.set("beds", String(filters.beds));
  if (filters.baths) next.set("baths", String(filters.baths));
  if (filters.minPrice) next.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) next.set("maxPrice", String(filters.maxPrice));
  if (filters.pageSize !== 40) next.set("pageSize", String(filters.pageSize));
  appendMapBoundsParams(next, bounds);
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

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchFieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function notifyMapResize() {
  window.dispatchEvent(new Event("resize"));
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
  const router = useRouter();
  const [isSearchPending, startSearchTransition] = useTransition();
  const [listings, setListings] = useState(initialListings);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(totalCount);
  const [sortBy, setSortBy] = useState("price-desc");
  const [mapView, setMapView] = useState<"map" | "satellite">("map");
  const [layersOpen, setLayersOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [boundsLoading, setBoundsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listPct, setListPct] = useState(LIST_PCT_DEFAULT);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [searchAsIMove, setSearchAsIMove] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
  const [hasMore, setHasMore] = useState(() => {
    if (typeof totalCount === "number") return initialListings.length < totalCount;
    return initialListings.length >= filters.pageSize;
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listScrollRef = useRef<HTMLElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const draggingRef = useRef(false);
  const filterBtnRef = useRef<HTMLButtonElement | null>(null);
  const toolbarQRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const latestBoundsRef = useRef<MapBounds | null>(null);
  const appliedBoundsKeyRef = useRef("");
  const boundsAbortRef = useRef<AbortController | null>(null);
  const searchAsIMoveRef = useRef(searchAsIMove);
  searchAsIMoveRef.current = searchAsIMove;
  const safeFooterHtml = normalizeTemplateHtml(footerHtml);

  // Location lives in the toolbar search bar; badge counts refinement filters only.
  const activeFilterCount = countActiveSearchFilters({ ...filters, q: "" });
  const toolbarLocationValue =
    filters.q || (filters.state ? stateNameForAbbr(filters.state) : "");

  const navigateFromToolbar = (nextQ: string) => {
    startSearchTransition(() => {
      router.push(
        buildNormalizedSearchHref({
          q: nextQ,
          state: filters.state,
          propertyType: filters.propertyType,
          beds: filters.beds,
          baths: filters.baths,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          pageSize: filters.pageSize,
        }),
      );
    });
  };

  const onToolbarSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    navigateFromToolbar(String(data.get("q") ?? ""));
  };

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const input = toolbarQRef.current;
    if (!input) return;
    return attachSearchSuggestions(input, {
      onSelect: (suggestion: SearchSuggestion) => {
        input.value = suggestionInputValue(suggestion);
        startSearchTransition(() => {
          router.push(suggestion.href);
        });
        return false;
      },
    });
  }, [toolbarLocationValue, router]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LIST_PCT_STORAGE_KEY);
      const value = raw ? Number(raw) : NaN;
      if (Number.isFinite(value) && value >= LIST_PCT_MIN && value <= LIST_PCT_MAX) {
        setListPct(value);
      }
    } catch {
      /* private browsing */
    }
  }, []);

  useEffect(() => {
    setListings(initialListings);
    setPage(1);
    setTotal(totalCount);
    setLoadError(null);
    setMapBounds(null);
    setPendingBounds(null);
    latestBoundsRef.current = null;
    appliedBoundsKeyRef.current = "";
    setHasMore(
      typeof totalCount === "number"
        ? initialListings.length < totalCount
        : initialListings.length >= filters.pageSize,
    );
  }, [initialListings, totalCount, filters.pageSize]);

  const replaceListingsForBounds = useCallback(
    async (bounds: MapBounds | null) => {
      const key = mapBoundsKey(bounds);
      if (key && key === appliedBoundsKeyRef.current) return;

      boundsAbortRef.current?.abort();
      const controller = new AbortController();
      boundsAbortRef.current = controller;
      loadingRef.current = true;
      setBoundsLoading(true);
      setLoadError(null);
      setPendingBounds(null);

      try {
        const qs = filtersToQuery(filters, 1, bounds);
        const res = await fetch(`/api/search/listings?${qs}`, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => ({}))) as {
          listings?: PropertyListing[];
          total?: number | null;
          error?: string;
        };

        if (!res.ok) {
          setLoadError(data.error || "Could not update map search.");
          return;
        }

        const incoming = Array.isArray(data.listings) ? data.listings : [];
        const nextTotal = typeof data.total === "number" ? data.total : incoming.length;

        setMapBounds(bounds);
        appliedBoundsKeyRef.current = key;
        setListings(incoming);
        setPage(1);
        setTotal(nextTotal);
        setHasMore(
          typeof nextTotal === "number"
            ? incoming.length < nextTotal
            : incoming.length >= filters.pageSize,
        );

        if (listScrollRef.current) {
          listScrollRef.current.scrollTop = 0;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError("Network error updating map search.");
      } finally {
        if (boundsAbortRef.current === controller) {
          boundsAbortRef.current = null;
          loadingRef.current = false;
          setBoundsLoading(false);
        }
      }
    },
    [filters],
  );

  const onMapBoundsChange = useCallback(
    (bounds: MapBounds, meta: { userGesture: boolean }) => {
      latestBoundsRef.current = bounds;

      if (searchAsIMoveRef.current) {
        // First programmatic emit (after fit) + every user pan/zoom.
        if (meta.userGesture || !appliedBoundsKeyRef.current) {
          void replaceListingsForBounds(bounds);
        }
        return;
      }

      if (meta.userGesture) {
        const changed = mapBoundsKey(bounds) !== appliedBoundsKeyRef.current;
        setPendingBounds(changed ? bounds : null);
      }
    },
    [replaceListingsForBounds],
  );

  const onSearchAsIMoveChange = useCallback(
    (enabled: boolean) => {
      setSearchAsIMove(enabled);
      if (enabled) {
        const bounds = latestBoundsRef.current;
        if (bounds) void replaceListingsForBounds(bounds);
        return;
      }
      appliedBoundsKeyRef.current = "";
      setMapBounds(null);
      setPendingBounds(null);
      void replaceListingsForBounds(null);
    },
    [replaceListingsForBounds],
  );

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("input, select, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [filtersOpen]);

  const sorted = useMemo(() => {
    return [...listings].sort((a, b) => {
      const aPriced = a.price > 0 ? 1 : 0;
      const bPriced = b.price > 0 ? 1 : 0;
      if (aPriced !== bPriced) return bPriced - aPriced;
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
      const qs = filtersToQuery(filters, nextPage, mapBounds);
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
  }, [filters, hasMore, mapBounds, page, total]);

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

  const updateSplitFromClientX = useCallback((clientX: number) => {
    const layout = layoutRef.current;
    if (!layout) return;
    const rect = layout.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(LIST_PCT_MAX, Math.max(LIST_PCT_MIN, pct));
    setListPct(clamped);
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      updateSplitFromClientX(event.clientX);
      notifyMapResize();
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDraggingSplit(false);
      document.body.classList.remove("search-map-splitting");
      try {
        sessionStorage.setItem(LIST_PCT_STORAGE_KEY, String(listPct));
      } catch {
        /* ignore */
      }
      notifyMapResize();
      window.setTimeout(notifyMapResize, 50);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [listPct, updateSplitFromClientX]);

  const onSplitterPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    draggingRef.current = true;
    setIsDraggingSplit(true);
    document.body.classList.add("search-map-splitting");
    updateSplitFromClientX(event.clientX);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const showingCount = sorted.length;
  const totalLabel = typeof total === "number" ? total : showingCount;

  return (
    <div
      ref={layoutRef}
      className={`search-map-layout${isDraggingSplit ? " is-splitting" : ""}`}
      style={
        {
          ["--search-list-pct" as string]: `${listPct}%`,
        } as CSSProperties
      }
    >
      <section className="search-map-list" aria-label={title} ref={listScrollRef}>
        <div className="search-map-list__inner">
          <div className="search-map-list__toolbar">
            <form
              className="search-map-toolbar-search reovana-search-suggest-host"
              action="/search"
              method="get"
              onSubmit={onToolbarSearch}
            >
              <span className="search-map-toolbar-search__icon" aria-hidden="true">
                <SearchFieldIcon />
              </span>
              <input
                ref={toolbarQRef}
                key={`${filters.q}|${filters.state}`}
                type="search"
                name="q"
                defaultValue={toolbarLocationValue}
                placeholder="City, address, ZIP, or state"
                className="search-map-toolbar-search__input"
                autoComplete="off"
                aria-label="Search location"
              />
              <button
                type="submit"
                className="search-map-toolbar-search__submit"
                disabled={isSearchPending}
              >
                {isSearchPending ? "…" : "Search"}
              </button>
            </form>
            <button
              ref={filterBtnRef}
              type="button"
              className={`search-map-filters-btn${activeFilterCount > 0 ? " is-active" : ""}`}
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                event.stopPropagation();
                setFiltersOpen(true);
              }}
            >
              <FilterIcon />
              <span>Filters</span>
              {activeFilterCount > 0 ? (
                <span className="search-map-filters-btn__badge">{activeFilterCount}</span>
              ) : null}
            </button>
          </div>

          <div className="search-map-list__head">
            <h1>{title}</h1>
            <p>{description}</p>
            <p>
              Showing <strong>{showingCount}</strong> of <strong>{totalLabel}</strong> properties
              {mapBounds ? " in map area" : ""}
              {boundsLoading ? " · Updating…" : ""}
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
            {loadError ? (
              <p className="search-map-list__status search-map-list__status--error">{loadError}</p>
            ) : null}
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

      <div
        className="search-map-splitter"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize listings and map"
        aria-valuemin={LIST_PCT_MIN}
        aria-valuemax={LIST_PCT_MAX}
        aria-valuenow={Math.round(listPct)}
        tabIndex={0}
        onPointerDown={onSplitterPointerDown}
        onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            setListPct((p) => Math.max(LIST_PCT_MIN, p - 2));
            notifyMapResize();
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            setListPct((p) => Math.min(LIST_PCT_MAX, p + 2));
            notifyMapResize();
          }
        }}
      >
        <span className="search-map-splitter__grip" aria-hidden="true" />
      </div>

      <section className="search-map-panel" aria-label="Property map">
        <AuctionsMapToolbar
          mapView={mapView}
          onMapViewChange={setMapView}
          layersOpen={layersOpen}
          onLayersOpenChange={setLayersOpen}
          searchAsIMove={searchAsIMove}
          onSearchAsIMoveChange={onSearchAsIMoveChange}
        />
        <div className="search-map-panel__wrap">
          {!searchAsIMove && pendingBounds ? (
            <div className="search-map-area-cta">
              <button
                type="button"
                className="search-map-area-cta__btn"
                disabled={boundsLoading}
                onClick={() => {
                  if (pendingBounds) void replaceListingsForBounds(pendingBounds);
                }}
              >
                {boundsLoading ? "Searching…" : "Search this area"}
              </button>
            </div>
          ) : null}
          <AuctionsMap
            properties={toMapProperties(sorted)}
            mapView={mapView}
            layersPanelOpen={layersOpen}
            lockAutoFit={mapBounds != null}
            onBoundsChange={onMapBoundsChange}
          />
        </div>
      </section>

      {portalReady && filtersOpen
        ? createPortal(
            <div
              className="search-filters-overlay"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setFiltersOpen(false);
              }}
            >
              <div
                ref={dialogRef}
                className="search-filters-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="search-filters-title"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="search-filters-dialog__header">
                  <h2 id="search-filters-title">Filters</h2>
                  <button
                    type="button"
                    className="search-filters-dialog__close"
                    aria-label="Close filters"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setFiltersOpen(false);
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="search-filters-dialog__body">
                  <SearchPageForm
                    {...filters}
                    variant="panel"
                    onSubmitted={() => setFiltersOpen(false)}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
