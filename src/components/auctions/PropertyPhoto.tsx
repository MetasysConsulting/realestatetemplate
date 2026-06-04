"use client";

import { useState } from "react";

type PropertyPhotoProps = {
  src: string;
  alt: string;
};

export function PropertyPhoto({ src, alt }: PropertyPhotoProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div className="auctions-card__placeholder" aria-hidden>
        <span className="auctions-card__placeholder-icon">🏠</span>
      </div>
    );
  }

  return (
    <>
      {!loaded ? (
        <div className="auctions-card__placeholder auctions-card__placeholder--loading" aria-hidden>
          <span className="auctions-card__placeholder-spinner" />
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`auctions-card__photo${loaded ? " is-loaded" : ""}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}
