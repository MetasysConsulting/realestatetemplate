"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  chunkNeighborhoodRows,
  type HomeNeighborhood,
} from "@/lib/home-neighborhoods";

function NeighborhoodCard({ neighborhood }: { neighborhood: HomeNeighborhood }) {
  return (
    <Link
      href={neighborhood.href}
      className="reovana-neighborhood-card"
      aria-label={`Browse ${neighborhood.countLabel} properties in ${neighborhood.city}`}
    >
      <div className="reovana-neighborhood-card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={neighborhood.imageUrl} alt="" loading="lazy" decoding="async" />
      </div>
      <div className="reovana-neighborhood-card__content">
        <h6>{neighborhood.city}</h6>
        <span className="reovana-neighborhood-card__cta">
          {neighborhood.countLabel} Properties <span aria-hidden="true">›</span>
        </span>
      </div>
    </Link>
  );
}

function NeighborhoodRow({
  rowIndex,
  neighborhoods,
}: {
  rowIndex: number;
  neighborhoods: HomeNeighborhood[];
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
  }, [neighborhoods.length, updateScrollState]);

  const scrollByPage = (direction: "back" | "forward") => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollBy({
      left: direction === "forward" ? track.clientWidth * 0.85 : -track.clientWidth * 0.85,
      behavior: "smooth",
    });
  };

  return (
    <div className="reovana-neighborhoods-row">
      <div className="reovana-neighborhoods-row__controls">
        {canScrollBack ? (
          <button
            type="button"
            className="reovana-neighborhoods-row__nav"
            aria-label={`Scroll neighborhood row ${rowIndex + 1} back`}
            onClick={() => scrollByPage("back")}
          >
            ‹
          </button>
        ) : null}
      </div>
      <div
        ref={trackRef}
        className="reovana-neighborhoods-row__track"
        onScroll={updateScrollState}
      >
        {neighborhoods.map((neighborhood) => (
          <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
        ))}
      </div>
      <div className="reovana-neighborhoods-row__controls">
        {canScrollForward ? (
          <button
            type="button"
            className="reovana-neighborhoods-row__nav"
            aria-label={`Scroll neighborhood row ${rowIndex + 1} forward`}
            onClick={() => scrollByPage("forward")}
          >
            ›
          </button>
        ) : null}
      </div>
    </div>
  );
}

type NeighborhoodsCarouselProps = {
  neighborhoods: HomeNeighborhood[];
};

export function NeighborhoodsCarousel({ neighborhoods }: NeighborhoodsCarouselProps) {
  const rows = chunkNeighborhoodRows(neighborhoods, 4);

  if (!rows.length) {
    return (
      <div className="reovana-neighborhoods-carousel">
        <p className="reovana-neighborhoods__empty">No city inventory to show yet.</p>
      </div>
    );
  }

  return (
    <div className="reovana-neighborhoods-carousel">
      {rows.map((row, index) => (
        <NeighborhoodRow key={index} rowIndex={index} neighborhoods={row} />
      ))}
      <div className="reovana-neighborhoods__more">
        <Link href="/search" className="tf-btn bg-color-primary pd-23 reovana-neighborhoods__more-btn">
          More
        </Link>
      </div>
    </div>
  );
}
