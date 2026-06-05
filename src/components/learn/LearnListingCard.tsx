import Link from "next/link";
import type { FeaturedListing } from "@/lib/learn-content";

type LearnListingCardProps = {
  listing: FeaturedListing;
};

export function LearnListingCard({ listing }: LearnListingCardProps) {
  return (
    <Link href={listing.href} className="learn-listing-card">
      <div className="learn-listing-card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.imageUrl} alt={listing.title} loading="lazy" decoding="async" />
        <span className="learn-listing-card__tag">{listing.tag}</span>
      </div>
      <div className="learn-listing-card__body">
        <h3>{listing.title}</h3>
        <p className="learn-listing-card__location">
          <i className="icon-location" /> {listing.location}
        </p>
        <p className="learn-listing-card__bid">
          Est. Opening Bid <strong>{listing.openingBid}</strong>
        </p>
      </div>
    </Link>
  );
}
