"use client";

import { useState } from "react";
import { hasListingImage } from "@/lib/listing-images";

type ListingMediaProps = {
  imageUrl: string | null | undefined;
  alt: string;
  className?: string;
  imageClassName?: string;
  placeholderClassName?: string;
  showMissingLabel?: boolean;
};

export function ListingMedia({
  imageUrl,
  alt,
  className,
  imageClassName,
  placeholderClassName,
  showMissingLabel = true,
}: ListingMediaProps) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = hasListingImage(imageUrl) ? imageUrl!.trim() : null;
  const showPlaceholder = !resolvedUrl || failed;

  if (showPlaceholder) {
    return (
      <div
        className={["listing-media-placeholder", className, placeholderClassName].filter(Boolean).join(" ")}
        role="img"
        aria-label={alt}
      >
        {showMissingLabel ? (
          <>
            <span className="listing-media-placeholder__icon" aria-hidden="true">
              🖼
            </span>
            <span className="listing-media-placeholder__label">No image available</span>
          </>
        ) : null}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedUrl}
      alt={alt}
      className={imageClassName ?? className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
