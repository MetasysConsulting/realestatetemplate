"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListingMedia } from "@/components/listings/ListingMedia";
import {
  HOME_CATEGORY_ROWS,
  resolveHomeCategoryRowListings,
} from "@/lib/home-category-rows";
import { HudHomesPromoSection } from "@/components/home/HudHomesPromoSection";
import { ListingDetailLink } from "@/components/listings/ListingDetailLink";
import {
  BROWSE_LOCKED_PRICE_DISPLAY,
  formatCardLocation,
  formatCardPrice,
} from "@/lib/listing-browse-redact";
import type { PropertyListing } from "@/lib/load-category-listings";
import { getHomeRecentlyViewedListings } from "@/lib/recently-viewed";

function saleStatusLabel(status: string | undefined): string {
  const trimmed = status?.trim() ?? "";
  if (!trimmed || /^active$/i.test(trimmed)) return "For Sale";
  return trimmed;
}

function HomeCategoryCard({
  listing,
  categoryLabel,
}: {
  listing: PropertyListing;
  categoryLabel: string;
}) {
  const location = formatCardLocation(listing);
  const showPrice = listing.browseLocked || listing.price > 0;
  const price = listing.browseLocked
    ? BROWSE_LOCKED_PRICE_DISPLAY
    : formatCardPrice(listing.price);
  const showBeds = listing.bedrooms > 0;
  const showBaths = listing.bathrooms > 0;
  const showSqft = listing.squareFootage > 0;
  const showMeta = showBeds || showBaths || showSqft;
  const statusLabel = saleStatusLabel(listing.status);

  return (
    <article className="box-house hover-img reovana-home-category-card">
      <div className="image-wrap">
        <ListingDetailLink href={listing.detailPath} ariaLabel={`View ${location}`}>
          <ListingMedia imageUrl={listing.imageUrl} alt="" showMissingLabel={false} />
        </ListingDetailLink>
        <ul className="box-tag flex gap-8">
          <li className="flat-tag text-4 bg-main fw-6 text_white">{categoryLabel}</li>
          <li className="flat-tag text-4 bg-3 fw-6 text_white">{statusLabel}</li>
        </ul>
      </div>

      <div className="content">
        <ListingDetailLink
          href={listing.detailPath}
          className="location text-1 line-clamp-1"
        >
          <i className="icon-location" aria-hidden="true" />
          {location}
        </ListingDetailLink>

        {showMeta ? (
          <ul className="meta-list flex">
            {showBeds ? (
              <li className="text-1 flex">
                <span>{listing.bedrooms}</span>Beds
              </li>
            ) : null}
            {showBaths ? (
              <li className="text-1 flex">
                <span>
                  {Number.isInteger(listing.bathrooms)
                    ? listing.bathrooms
                    : listing.bathrooms.toFixed(1)}
                </span>
                Baths
              </li>
            ) : null}
            {showSqft ? (
              <li className="text-1 flex">
                <span>{listing.squareFootage.toLocaleString()}</span>Sqft
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="bot flex justify-between items-center">
          {showPrice ? <h5 className="price">{price}</h5> : <span />}
          <div className="wrap-btn flex">
            <ListingDetailLink
              href={listing.detailPath}
              className="tf-btn style-border pd-4"
              ariaLabel={`Details for ${location}`}
            >
              Details
            </ListingDetailLink>
          </div>
        </div>
      </div>
    </article>
  );
}

function CategoryRow({
  title,
  categoryLabel,
  listings,
}: {
  title: string;
  categoryLabel: string;
  listings: PropertyListing[];
}) {
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

  const showArrows = listings.length > 3;

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
              <HomeCategoryCard
                key={`${title}-${listing.id}`}
                listing={listing}
                categoryLabel={categoryLabel}
              />
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
      <CategoryRow
        title="Recently Viewed"
        categoryLabel="Recent"
        listings={recentListings}
      />
      {categoryRows.map((row) => (
        <div key={row.key} className="reovana-home-category-row-group">
          <CategoryRow
            title={row.title}
            categoryLabel={row.title}
            listings={row.listings}
          />
          {row.key === "hud-home" ? <HudHomesPromoSection /> : null}
        </div>
      ))}
    </div>
  );
}
