"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RecordRecentlyViewed } from "@/components/home/RecordRecentlyViewed";
import { ListingUnlockPaywall } from "@/components/properties/ListingUnlockPaywall";
import type { ProtyListingDetailModel } from "@/lib/proty-listing-detail";
import { UNLOCK_STORAGE_KEY } from "@/lib/property-gate";

type ProtyPropertyDetailProps = {
  model: ProtyListingDetailModel;
};

function buildMapEmbedUrl(model: ProtyListingDetailModel): string {
  const query = encodeURIComponent(
    `${model.mapAddress}, ${model.mapCity}, ${model.mapState} ${model.mapZip}`,
  );
  if (model.lat && model.lng) {
    return `https://maps.google.com/maps?q=${model.lat},${model.lng}&z=15&output=embed`;
  }
  return `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
}

function chunkAmenities(items: string[]): string[][] {
  const columns: string[][] = [[], [], []];
  items.forEach((item, index) => {
    columns[index % 3]!.push(item);
  });
  return columns.filter((col) => col.length > 0);
}

function ListingOverview({ model }: { model: ProtyListingDetailModel }) {
  return (
    <>
      <div className="heading flex justify-between">
        <div className="title text-5 fw-6 text-color-heading">{model.title}</div>
        <div className="price text-5 fw-6 text-color-heading reovana-blur-target">
          {model.priceDisplay}
          {model.priceSuffix ? (
            <span className="h5 lh-30 fw-4 text-color-default">{model.priceSuffix}</span>
          ) : null}
        </div>
      </div>
      <div className="info flex justify-between">
        <div className="feature">
          <p className="location text-1 flex items-center gap-10 reovana-blur-target">
            <i className="icon-location" />
            {model.locationLine}
          </p>
          <ul className="meta-list flex reovana-blur-target">
            {model.bedrooms > 0 ? (
              <li className="text-1 flex">
                <span>{model.bedrooms}</span>Bed
              </li>
            ) : null}
            {model.bathrooms > 0 ? (
              <li className="text-1 flex">
                <span>{model.bathrooms}</span>Bath
              </li>
            ) : null}
            {model.squareFootage > 0 ? (
              <li className="text-1 flex">
                <span>{model.squareFootage.toLocaleString()}</span>Sqft
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="info-detail reovana-blur-target">
        <div className="wrap-box">
          <div className="box-icon">
            <div className="icons">
              <i className="icon-SlidersHorizontal" />
            </div>
            <div className="content">
              <div className="text-4 text-color-default">Type</div>
              <div className="text-1 text-color-heading">{model.propertyType}</div>
            </div>
          </div>
          <div className="box-icon">
            <div className="icons">
              <i className="icon-Hammer" />
            </div>
            <div className="content">
              <div className="text-4 text-color-default">Status</div>
              <div className="text-1 text-color-heading">{model.status}</div>
            </div>
          </div>
        </div>
      </div>
      <Link href="/contact" className="tf-btn bg-color-primary pd-21 fw-6">
        Ask a question
      </Link>
    </>
  );
}

export function ProtyPropertyDetail({ model }: ProtyPropertyDetailProps) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(UNLOCK_STORAGE_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    setUnlocked(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(UNLOCK_STORAGE_KEY, "1");
    }
  };
  const mapUrl = useMemo(
    () => (model.hasRealCoordinates ? buildMapEmbedUrl(model) : ""),
    [model],
  );
  const amenityColumns = useMemo(() => chunkAmenities(model.amenities), [model.amenities]);
  const galleryImages = useMemo(
    () => [...new Set(model.galleryImages.filter(Boolean))],
    [model.galleryImages],
  );
  const [mainImage, ...thumbImages] = galleryImages;
  const singlePhoto = galleryImages.length <= 1;

  return (
    <div
      id="listing-detail-root"
      className={`reovana-listing-detail main-content${unlocked ? " reovana-listing-detail--unlocked" : " reovana-listing-detail--locked"}`}
    >
      <RecordRecentlyViewed {...model.recentlyViewed} />

      <section className="flat-title reovana-listing-detail__breadcrumb">
        <div className="tf-container">
          <div className="row">
            <div className="col-lg-12">
              <div className="title-inner">
                <ul className="breadcrumb">
                  <li>
                    <Link className="home fw-6 text-color-3" href="/">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href={model.backHref}>{model.backLabel}</Link>
                  </li>
                  <li>{model.title}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`section-property-image reovana-listing-detail__gallery${singlePhoto ? " reovana-listing-detail__gallery--single" : ""}`}
      >
        <div className="tf-container">
          <div className="row">
            <div className="col-12">
              {singlePhoto ? (
                <div className="wrap-image reovana-listing-detail__gallery-single">
                  <div className="image img-1">
                    <span className="image-wrap relative d-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mainImage} alt={model.title} />
                    </span>
                    <div className="tag-property">
                      <div className="text-16 text_white fw-6 lh-20">{model.categoryLabel}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="wrap-image">
                  <div className="image img-1">
                    <span className="image-wrap relative d-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mainImage} alt={model.title} />
                    </span>
                    <div className="tag-property">
                      <div className="text-16 text_white fw-6 lh-20">{model.categoryLabel}</div>
                    </div>
                  </div>
                  {thumbImages.length > 0 ? (
                    <div className="wrap-image-right">
                      {thumbImages[0] ? (
                        <div className="image img-2">
                          <span className="image-wrap relative d-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumbImages[0]} alt="" />
                          </span>
                        </div>
                      ) : null}
                      {thumbImages.length > 1 ? (
                        <div className="bot">
                          {thumbImages[1] ? (
                            <div className="image img-3">
                              <span className="image-wrap relative d-block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={thumbImages[1]} alt="" />
                              </span>
                            </div>
                          ) : null}
                          {thumbImages[2] ? (
                            <div className="image img-4">
                              <span className="image-wrap relative d-block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={thumbImages[2]} alt="" />
                              </span>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-property-detail reovana-listing-detail__body">
        <div className="tf-container">
          <div className="row">
            <div className="col-xl-8 col-lg-7">
              <div className="wg-property box-overview">
                <ListingOverview model={model} />
              </div>

              <ListingUnlockPaywall unlocked={unlocked} onUnlock={handleUnlock} />

              <div className="wg-property box-property-detail reovana-blur-target">
                <div className="wg-title text-11 fw-6 text-color-heading">Property Details</div>
                <div className="content">
                  <p className="description text-1">{model.description}</p>
                </div>
                <div className="box">
                  <ul>
                    {model.detailFacts.slice(0, Math.ceil(model.detailFacts.length / 2)).map((fact) => (
                      <li className="flex" key={fact.label}>
                        <p className="fw-6">{fact.label}</p>
                        <p>{fact.value}</p>
                      </li>
                    ))}
                  </ul>
                  <ul>
                    {model.detailFacts.slice(Math.ceil(model.detailFacts.length / 2)).map((fact) => (
                      <li className="flex" key={fact.label}>
                        <p className="fw-6">{fact.label}</p>
                        <p>{fact.value}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="wg-property box-amenities reovana-blur-target">
                <div className="wg-title text-11 fw-6 text-color-heading">Amenities And Features</div>
                <div className="wrap-feature">
                  {amenityColumns.map((column, columnIndex) => (
                    <div className="box-feature" key={columnIndex}>
                      <ul>
                        {column.map((item) => (
                          <li className="feature-item" key={item}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {model.hasRealCoordinates ? (
                <div className="wg-property single-property-map reovana-blur-target">
                  <div className="wg-title text-11 fw-6 text-color-heading">Get Direction</div>
                  <iframe
                    className="map reovana-listing-detail__map"
                    src={mapUrl}
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map for ${model.title}`}
                  />
                  <div className="info-map">
                    <ul className="box-left">
                      <li>
                        <span className="label fw-6">Address</span>
                        <div className="text text-variant-1">{model.mapAddress}</div>
                      </li>
                      <li>
                        <span className="label fw-6">City</span>
                        <div className="text text-variant-1">{model.mapCity}</div>
                      </li>
                      <li>
                        <span className="label fw-6">State</span>
                        <div className="text text-variant-1">{model.mapState}</div>
                      </li>
                    </ul>
                    <ul className="box-right">
                      <li>
                        <span className="label fw-6">Postal code</span>
                        <div className="text text-variant-1">{model.mapZip}</div>
                      </li>
                      {model.mapCounty ? (
                        <li>
                          <span className="label fw-6">County</span>
                          <div className="text text-variant-1">{model.mapCounty}</div>
                        </li>
                      ) : null}
                      <li>
                        <span className="label fw-6">Category</span>
                        <div className="text text-variant-1">{model.categoryLabel}</div>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : null}

              {model.disclaimer ? (
                <p className="reovana-listing-detail__disclaimer reovana-blur-target">{model.disclaimer}</p>
              ) : null}
            </div>

            <div className="col-xl-4 col-lg-5">
              <div className="tf-sidebar sticky-sidebar reovana-listing-detail__sidebar">
                <ListingUnlockPaywall
                  unlocked={unlocked}
                  variant="sidebar"
                  onUnlock={handleUnlock}
                />

                <form className="form-contact-seller mb-30 reovana-blur-target" onSubmit={(e) => e.preventDefault()}>
                  <h4 className="heading-title mb-30">Contact Sellers</h4>
                  <div className="seller-info">
                    <div className="avartar">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/reovana/logo.png" alt="REOVANA" />
                    </div>
                    <div className="content">
                      <h6 className="name">REOVANA Listing Team</h6>
                      <ul className="contact">
                        <li>
                          <i className="icon-phone-1" />
                          <span>Register interest to inquire</span>
                        </li>
                        <li>
                          <i className="icon-mail" />
                          <Link href="/contact">contact@reovana.com</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <fieldset className="mb-12">
                    <input type="text" className="form-control" placeholder="Full Name" name="name" />
                  </fieldset>
                  <fieldset className="mb-30">
                    <textarea name="message" cols={30} rows={6} placeholder="How can we help?" />
                  </fieldset>
                  <Link href="/contact" className="tf-btn bg-color-primary w-full">
                    Send message
                  </Link>
                </form>

                <form className="form-contact-agent reovana-blur-target" onSubmit={(e) => e.preventDefault()}>
                  <h4 className="heading-title mb-30">More About This Property</h4>
                  <fieldset>
                    <input type="text" className="form-control" placeholder="Your name" name="name" />
                  </fieldset>
                  <fieldset>
                    <input type="text" className="form-control" placeholder="Email" name="email" />
                  </fieldset>
                  <fieldset className="phone">
                    <input type="text" className="form-control" placeholder="Phone" name="phone" />
                  </fieldset>
                  <fieldset>
                    <textarea name="message" cols={30} rows={6} placeholder="Message" />
                  </fieldset>
                  <div className="wrap-btn">
                    <Link href="/contact" className="tf-btn bg-color-primary fw-6 w-full">
                      Email agent
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
