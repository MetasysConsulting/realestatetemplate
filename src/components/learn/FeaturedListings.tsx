import { LearnListingCard } from "@/components/learn/LearnListingCard";
import { FEATURED_LISTINGS } from "@/lib/learn-content";

type FeaturedListingsProps = {
  title?: string;
};

export function FeaturedListings({
  title = "Featured auction homes",
}: FeaturedListingsProps) {
  return (
    <section className="learn-panel learn-panel--listings" aria-label={title}>
      <h2>{title}</h2>
      <div className="learn-listing-grid">
        {FEATURED_LISTINGS.map((listing) => (
          <LearnListingCard key={listing.title} listing={listing} />
        ))}
      </div>
    </section>
  );
}
