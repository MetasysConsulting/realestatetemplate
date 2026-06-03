"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { PropertyCard } from "@/components/property/PropertyCard";
import type { Property } from "@/lib/properties";

import "swiper/css";
import "swiper/css/pagination";

type PropertySliderProps = {
  properties: Property[];
  title?: string;
  subtitle?: string;
};

export function PropertySlider({
  properties,
  title = "Today's Luxury Listings",
  subtitle = "Thousands of luxury home enthusiasts just like you visit our website.",
}: PropertySliderProps) {
  return (
    <section className="section-listing tf-spacing-1">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            <div className="heading-section text-center">
              <h2 className="title">{title}</h2>
              <p className="text-1">{subtitle}</p>
            </div>
            <Swiper
              modules={[Pagination]}
              spaceBetween={15}
              slidesPerView={1}
              pagination={{ clickable: true }}
              breakpoints={{
                767: { slidesPerView: 2, spaceBetween: 20 },
                992: { slidesPerView: 3, spaceBetween: 24 },
              }}
              className="style-pagination tf-sw-mobile-1"
            >
              {properties.map((property) => (
                <SwiperSlide key={property.id}>
                  <PropertyCard property={property} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
