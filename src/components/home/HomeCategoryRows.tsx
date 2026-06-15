"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
    <article className="reovana-home-category-card">
      <div className="reovana-home-category-card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${listing.address}, ${listing.city}, ${listing.state}`}
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
        <Link href={listing.detailPath} className="tf-btn bg-color-primary reovana-home-category-card__more">
          More
        </Link>
      </div>
    </article>
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
  if (!listings.length) return null;

  return (
    <section className="reovana-home-category-row">
      <div className="tf-container">
        <h3 className="reovana-home-category-row__title">{title}</h3>
        <div className="reovana-home-category-row__track">
          {listings.slice(0, 6).map((listing) => (
            <HomeCategoryCard key={`${title}-${listing.id}`} listing={listing} />
          ))}
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
