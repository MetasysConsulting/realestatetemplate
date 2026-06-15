"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import {
  HOME_CATEGORY_ROWS,
  getHomeCategoryRowListings,
} from "@/lib/home-category-rows";
import type { PropertyListing } from "@/lib/load-category-listings";
import {
  getRecentlyViewed,
  type RecentlyViewedListing,
} from "@/lib/recently-viewed";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function HomeCategoryCard({ listing }: { listing: PropertyListing }) {
  const [imageUrl, setImageUrl] = useState(listing.imageUrl);

  return (
    <Link
      href={listing.detailPath}
      className="reovana-home-category-card"
      aria-label={`View ${listing.address}, ${listing.city}, ${listing.state}`}
    >
      <div className="reovana-home-category-card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setImageUrl(DEFAULT_AUCTION_PROPERTY_IMAGE)}
        />
      </div>
      <div className="reovana-home-category-card__body">
        <p className="reovana-home-category-card__label">{listing.priceLabel}</p>
        <p className="reovana-home-category-card__price">{formatPrice(listing.price)}</p>
        <h4 className="reovana-home-category-card__address">
          {listing.address}, {listing.city}, {listing.state}
        </h4>
      </div>
    </Link>
  );
}

function recentlyViewedToListing(item: RecentlyViewedListing): PropertyListing {
  return {
    id: item.id,
    address: item.address,
    city: item.city,
    state: item.state,
    zip: item.zip,
    price: item.price,
    priceLabel: item.priceLabel,
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    propertyType: "Recently Viewed",
    status: "Viewed",
    tags: [],
    imageUrl: item.imageUrl,
    detailPath: item.detailPath,
    lat: 0,
    lng: 0,
    isNew: false,
  };
}

function CategoryRow({ title, listings }: { title: string; listings: PropertyListing[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    setCanScrollBack(track.scrollLeft > 4);
    setCanScrollForward(track.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollState();

    const onResize = () => updateScrollState();
    window.addEventListener("resize", onResize);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateScrollState())
        : null;
    observer?.observe(track);

    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [listings.length, updateScrollState]);

  const scrollByPage = (direction: "back" | "forward") => {
    const track = trackRef.current;
    if (!track) return;

    const amount = track.clientWidth;
    track.scrollBy({
      left: direction === "forward" ? amount : -amount,
      behavior: "smooth",
    });
  };

  if (!listings.length) return null;

  const showArrows = listings.length > 4;

  return (
    <section className="reovana-home-category-row">
      <div className="tf-container">
        <h3 className="reovana-home-category-row__title">{title}</h3>
        <div
          className={`reovana-home-category-row__carousel${showArrows ? "" : " reovana-home-category-row__carousel--plain"}`}
        >
          {showArrows ? (
            <button
              type="button"
              className="reovana-home-category-row__arrow reovana-home-category-row__arrow--prev"
              aria-label={`Show previous ${title} properties`}
              disabled={!canScrollBack}
              onClick={() => scrollByPage("back")}
            >
              <span aria-hidden="true">‹</span>
            </button>
          ) : null}

          <div
            ref={trackRef}
            className="reovana-home-category-row__track"
            onScroll={updateScrollState}
          >
            {listings.slice(0, 6).map((listing) => (
              <HomeCategoryCard key={`${title}-${listing.id}`} listing={listing} />
            ))}
          </div>

          {showArrows ? (
            <button
              type="button"
              className="reovana-home-category-row__arrow reovana-home-category-row__arrow--next"
              aria-label={`Show next ${title} properties`}
              disabled={!canScrollForward}
              onClick={() => scrollByPage("forward")}
            >
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function HomeCategoryRows() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedListing[]>([]);

  useEffect(() => {
    const sync = () => setRecentlyViewed(getRecentlyViewed());
    sync();
    window.addEventListener("reovana:recently-viewed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("reovana:recently-viewed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const categoryRows = useMemo(
    () =>
      HOME_CATEGORY_ROWS.map((row) => ({
        ...row,
        listings: getHomeCategoryRowListings(row),
      })),
    [],
  );

  const recentListings = recentlyViewed.map(recentlyViewedToListing);

  return (
    <div className="reovana-home-category-rows">
      {recentListings.length > 0 ? (
        <CategoryRow title="Recently Viewed" listings={recentListings} />
      ) : null}
      {categoryRows.map((row) => (
        <CategoryRow key={row.key} title={row.title} listings={row.listings} />
      ))}
    </div>
  );
}
