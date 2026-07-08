"use client";

import { useCallback, useState } from "react";
import {
  classifyGalleryImage,
  galleryFrameStyle,
  type GalleryImageMeta,
  type GalleryFrameVariant,
} from "@/lib/listing-gallery-layout";

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

function GalleryPhotoTag({ current, total }: { current: number; total: number }) {
  return (
    <div className="tag-property">
      <div className="icon">{GALLERY_CAMERA_ICON}</div>
      <div className="text-16 text_white fw-6 lh-20">
        {current}/{total} Photos
      </div>
    </div>
  );
}

type SmartGalleryImageProps = {
  src: string;
  alt: string;
  variant: GalleryFrameVariant;
  onMeta?: (meta: GalleryImageMeta) => void;
  onClick?: () => void;
  button?: boolean;
};

function SmartGalleryImage({ src, alt, variant, onMeta, onClick, button }: SmartGalleryImageProps) {
  const [meta, setMeta] = useState<GalleryImageMeta | null>(null);

  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      const next = classifyGalleryImage(img.naturalWidth, img.naturalHeight);
      setMeta(next);
      onMeta?.(next);
    },
    [onMeta],
  );

  const layout = meta?.layout ?? "loading";
  const fit = meta?.fit ?? "cover";
  const frameClass = [
    "reovana-gallery-frame",
    `reovana-gallery-frame--${layout}`,
    `reovana-gallery-frame--fit-${fit}`,
    `reovana-gallery-frame--${variant}`,
  ].join(" ");

  const frame = (
    <span className={frameClass} style={galleryFrameStyle(meta, variant)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} onLoad={handleLoad} />
    </span>
  );

  if (button && onClick) {
    return (
      <button type="button" className="reovana-gallery-thumb-btn image-wrap relative d-block" onClick={onClick}>
        {frame}
      </button>
    );
  }

  return <span className="image-wrap relative d-block">{frame}</span>;
}

type ListingGalleryProps = {
  images: string[];
  alt: string;
};

export function ListingGallery({ images, alt }: ListingGalleryProps) {
  const unique = images.filter((url, index, all) => url && all.indexOf(url) === index);
  const [activeIndex, setActiveIndex] = useState(0);
  const [heroLayout, setHeroLayout] = useState<string | null>(null);

  if (!unique.length) return null;

  const safeIndex = Math.min(activeIndex, unique.length - 1);
  const mainImage = unique[safeIndex];
  const thumbImages = unique.filter((_, index) => index !== safeIndex).slice(0, 3);
  const singlePhoto = unique.length <= 1;

  const galleryClass = [
    "reovana-listing-gallery",
    "reovana-listing-detail__gallery",
    singlePhoto ? "reovana-listing-detail__gallery--single" : "reovana-listing-detail__gallery--multi",
    heroLayout ? `reovana-listing-gallery--layout-${heroLayout}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={galleryClass}>
      <div className="wrap-image">
        <div className="image img-1">
          <SmartGalleryImage
            src={mainImage}
            alt={alt}
            variant="hero"
            onMeta={(meta) => setHeroLayout(meta.layout)}
          />
          <GalleryPhotoTag current={safeIndex + 1} total={unique.length} />
        </div>

        {!singlePhoto && thumbImages.length > 0 ? (
          <div className="wrap-image-right">
            {thumbImages[0] ? (
              <div className="image img-2">
                <SmartGalleryImage
                  src={thumbImages[0]}
                  alt=""
                  variant="thumb"
                  button
                  onClick={() => setActiveIndex(unique.indexOf(thumbImages[0]))}
                />
              </div>
            ) : null}
            {thumbImages.length > 1 ? (
              <div className="bot">
                {thumbImages[1] ? (
                  <div className="image img-3">
                    <SmartGalleryImage
                      src={thumbImages[1]}
                      alt=""
                      variant="thumb"
                      button
                      onClick={() => setActiveIndex(unique.indexOf(thumbImages[1]))}
                    />
                  </div>
                ) : null}
                {thumbImages[2] ? (
                  <div className="image img-4">
                    <SmartGalleryImage
                      src={thumbImages[2]}
                      alt=""
                      variant="thumb"
                      button
                      onClick={() => setActiveIndex(unique.indexOf(thumbImages[2]))}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
