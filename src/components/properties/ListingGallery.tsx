"use client";

import { useCallback, useState } from "react";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";
import { hasListingImage } from "@/lib/listing-images";

const GALLERY_CAMERA_ICON = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.875 13.125L6.17417 8.82583C6.34828 8.65172 6.55498 8.51361 6.78246 8.41938C7.00995 8.32515 7.25377 8.27665 7.5 8.27665C7.74623 8.27665 7.99005 8.32515 8.21754 8.41938C8.44502 8.51361 8.65172 8.65172 8.82583 8.82583L13.125 13.125M11.875 11.875L13.0492 10.7008C13.2233 10.5267 13.43 10.3886 13.6575 10.2944C13.885 10.2001 14.1288 10.1516 14.375 10.1516C14.6212 10.1516 14.865 10.2001 15.0925 10.2944C15.32 10.3886 15.5267 10.5267 15.7008 10.7008L18.125 13.125M3.125 16.25H16.875C17.2065 16.25 17.5245 16.1183 17.7589 15.8839C17.9933 15.6495 18.125 15.3315 18.125 15V5C18.125 4.66848 17.9933 4.35054 17.7589 4.11612C17.5245 3.8817 17.2065 3.75 16.875 3.75H3.125C2.79348 3.75 2.47554 3.8817 2.24112 4.11612C2.0067 4.35054 1.875 4.66848 1.875 5V15C1.875 15.3315 2.0067 15.6495 2.24112 15.8839C2.47554 16.1183 2.79348 16.25 3.125 16.25ZM11.875 6.875H11.8817V6.88167H11.875V6.875ZM12.1875 6.875C12.1875 6.95788 12.1546 7.03737 12.096 7.09597C12.0374 7.15458 11.9579 7.1875 11.875 7.1875C11.7921 7.1875 11.7126 7.15458 11.654 7.09597C11.5954 7.03737 11.5625 6.95788 11.5625 6.875C11.5625 6.79212 11.5954 6.71263 11.654 6.65403C11.7126 6.59542 11.7921 6.5625 11.875 6.5625C11.9579 6.5625 12.0374 6.59542 12.096 6.65403C12.1546 6.71263 12.1875 6.79212 12.1875 6.875Z"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const STOCK_IMAGE_PREFIX = "/images/auction-properties/";

function isRealGalleryImage(url: string): boolean {
  const trimmed = url.trim();
  if (!hasListingImage(trimmed)) return false;
  if (trimmed === DEFAULT_AUCTION_PROPERTY_IMAGE) return false;
  if (trimmed.startsWith(STOCK_IMAGE_PREFIX)) return false;
  return true;
}

function GalleryPhotoTag({ current, total }: { current: number; total: number }) {
  if (total <= 0) return null;

  return (
    <div className="tag-property reovana-gallery-grid__photo-tag">
      <div className="icon">{GALLERY_CAMERA_ICON}</div>
      <div className="text-16 text_white fw-6 lh-20">
        {current}/{total} Photos
      </div>
    </div>
  );
}

function GalleryPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`listing-media-placeholder reovana-gallery-grid__placeholder${compact ? " reovana-gallery-grid__placeholder--compact" : ""}`}>
      <span className="listing-media-placeholder__icon" aria-hidden="true">
        🖼
      </span>
      <span className="listing-media-placeholder__label">No image available</span>
    </div>
  );
}

type GalleryCellProps = {
  src: string | null;
  alt: string;
  onClick?: () => void;
  overlay?: string;
};

function GalleryCell({ src, alt, onClick, overlay }: GalleryCellProps) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  const inner = showPlaceholder ? (
    <GalleryPlaceholder compact />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
  );

  if (onClick && src && !failed) {
    return (
      <button type="button" className="reovana-gallery-grid__cell-btn" onClick={onClick}>
        {inner}
        {overlay ? <span className="reovana-gallery-grid__overlay">{overlay}</span> : null}
      </button>
    );
  }

  return (
    <div className="reovana-gallery-grid__cell-inner">
      {inner}
      {overlay ? <span className="reovana-gallery-grid__overlay">{overlay}</span> : null}
    </div>
  );
}

type ListingGalleryProps = {
  images: string[];
  alt: string;
};

export function ListingGallery({ images, alt }: ListingGalleryProps) {
  const unique = images.filter((url, index, all) => isRealGalleryImage(url) && all.indexOf(url) === index);
  const [activeIndex, setActiveIndex] = useState(0);

  const safeIndex = unique.length ? Math.min(activeIndex, unique.length - 1) : 0;
  const heroImage = unique[safeIndex] ?? null;
  const sidePool = unique.filter((_, index) => index !== safeIndex);
  const sideSlots = Array.from({ length: 4 }, (_, index) => sidePool[index] ?? null);
  const extraPhotoCount = Math.max(0, unique.length - 5);

  const handleSelect = useCallback(
    (src: string) => {
      const nextIndex = unique.indexOf(src);
      if (nextIndex >= 0) setActiveIndex(nextIndex);
    },
    [unique],
  );

  return (
    <div className="reovana-listing-gallery reovana-listing-detail__gallery reovana-listing-gallery--grid">
      <div className="reovana-gallery-grid">
        <div className="reovana-gallery-grid__hero">
          <GalleryCell src={heroImage} alt={alt} />
          <GalleryPhotoTag current={safeIndex + 1} total={unique.length} />
        </div>

        {sideSlots.map((src, index) => {
          const isLast = index === 3;
          const overlay = isLast && extraPhotoCount > 0 ? `+${extraPhotoCount} more` : undefined;
          const sideImage = src;

          return (
            <div key={`side-${index}`} className="reovana-gallery-grid__cell">
              <GalleryCell
                src={sideImage}
                alt={sideImage ? `${alt} photo ${index + 2}` : ""}
                onClick={sideImage ? () => handleSelect(sideImage) : undefined}
                overlay={overlay}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
