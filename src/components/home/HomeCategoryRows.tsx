"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListingMedia } from "@/components/listings/ListingMedia";
import {
  HOME_CATEGORY_ROWS,
  resolveHomeCategoryRowListings,
} from "@/lib/home-category-rows";
import { HudHomesPromoSection } from "@/components/home/HudHomesPromoSection";
import { ListingDetailLink } from "@/components/listings/ListingDetailLink";
import type { PropertyListing } from "@/lib/load-category-listings";
import { getHomeRecentlyViewedListings } from "@/lib/recently-viewed";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function HomeCategoryCard({ listing }: { listing: PropertyListing }) {
  return (
    <ListingDetailLink
      href={listing.detailPath}
      className="reovana-home-category-card"
      ariaLabel={`View ${listing.address}, ${listing.city}, ${listing.state}`}
    >
      <div className="reovana-home-category-card__media">
        <ListingMedia imageUrl={listing.imageUrl} alt="" showMissingLabel={false} />
      </div>
      <div className="reovana-home-category-card__body">
        <p className="reovana-home-category-card__label">{listing.priceLabel}</p>
        <p className="reovana-home-category-card__price">{formatPrice(listing.price)}</p>
        <h4 className="reovana-home-category-card__address">
          {listing.address}, {listing.city}, {listing.state}
        </h4>
      </div>
    </ListingDetailLink>
  );
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

type HomeCategoryRowsProps = {
  rowListings: Record<string, PropertyListing[]>;
};

export function HomeCategoryRows({ rowListings }: HomeCategoryRowsProps) {
  const [recentListings, setRecentListings] = useState<PropertyListing[]>([]);

  useEffect(() => {
    const refresh = () => setRecentListings(getHomeRecentlyViewedListings());
    refresh();
    window.addEventListener("reovana:recently-viewed", refresh);
    return () => window.removeEventListener("reovana:recently-viewed", refresh);
  }, []);

  const categoryRows = useMemo(
    () =>
      HOME_CATEGORY_ROWS.map((row) => ({
        ...row,
        listings: resolveHomeCategoryRowListings(rowListings, row),
      })),
    [rowListings],
  );

  return (
    <div className="reovana-home-category-rows">
      <CategoryRow title="Recently Viewed" listings={recentListings} />
      {categoryRows.map((row) => (
        <div key={row.key} className="reovana-home-category-row-group">
          <CategoryRow title={row.title} listings={row.listings} />
          {row.key === "hud-home" ? <HudHomesPromoSection /> : null}
        </div>
      ))}
    </div>
  );
}
