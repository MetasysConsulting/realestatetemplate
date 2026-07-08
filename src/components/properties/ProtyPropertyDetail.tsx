"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RecordRecentlyViewed } from "@/components/home/RecordRecentlyViewed";
import { ListingUnlockPaywall } from "@/components/properties/ListingUnlockPaywall";
import type { ProtyListingDetailModel } from "@/lib/proty-listing-detail";
import {
  readListingUnlocked,
  syncBlurTargets,
  writeListingUnlocked,
} from "@/lib/property-gate";

type ProtyPropertyDetailProps = {
  model: ProtyListingDetailModel;
};

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

const OVERVIEW_ACTION_ICONS = [
  (
    <svg key="heart" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15.75 6.1875C15.75 4.32375 14.1758 2.8125 12.234 2.8125C10.7828 2.8125 9.53625 3.657 9 4.86225C8.46375 3.657 7.21725 2.8125 5.76525 2.8125C3.825 2.8125 2.25 4.32375 2.25 6.1875C2.25 11.6025 9 15.1875 9 15.1875C9 15.1875 15.75 11.6025 15.75 6.1875Z"
        stroke="#5C5E61"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  (
    <svg key="share" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.625 15.75L2.25 12.375M2.25 12.375L5.625 9M2.25 12.375H12.375M12.375 2.25L15.75 5.625M15.75 5.625L12.375 9M15.75 5.625H5.625"
        stroke="#5C5E61"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  (
    <svg key="print" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.04 10.3718C4.86 10.3943 4.68 10.4183 4.5 10.4438M5.04 10.3718C7.66969 10.0418 10.3303 10.0418 12.96 10.3718M5.04 10.3718L4.755 13.5M12.96 10.3718C13.14 10.3943 13.32 10.4183 13.5 10.4438M12.96 10.3718L13.245 13.5L13.4167 15.3923C13.4274 15.509 13.4136 15.6267 13.3762 15.7378C13.3388 15.8489 13.2787 15.951 13.1996 16.0376C13.1206 16.1242 13.0244 16.1933 12.9172 16.2407C12.8099 16.288 12.694 16.3125 12.5767 16.3125H5.42325C4.92675 16.3125 4.53825 15.8865 4.58325 15.3923L4.755 13.5M4.755 13.5H3.9375C3.48995 13.5 3.06072 13.3222 2.74426 13.0057C2.42779 12.6893 2.25 12.2601 2.25 11.8125V7.092C2.25 6.28125 2.826 5.58075 3.62775 5.46075C4.10471 5.3894 4.58306 5.32764 5.0625 5.2755M13.2435 13.5H14.0618C14.2834 13.5001 14.5029 13.4565 14.7078 13.3718C14.9126 13.287 15.0987 13.1627 15.2555 13.006C15.4123 12.8493 15.5366 12.6632 15.6215 12.4585C15.7063 12.2537 15.75 12.0342 15.75 11.8125V7.092C15.75 6.28125 15.174 5.58075 14.3723 5.46075C13.8953 5.38941 13.4169 5.32764 12.9375 5.2755M12.9375 5.2755C10.3202 4.99073 7.67978 4.99073 5.0625 5.2755M12.9375 5.2755V2.53125C12.9375 2.0655 12.5595 1.6875 12.0938 1.6875H5.90625C5.4405 1.6875 5.0625 2.0655 5.0625 2.53125V5.2755M13.5 7.875H13.506V7.881H13.5V7.875ZM11.25 7.875H11.256V7.881H11.25V7.875Z"
        stroke="#5C5E61"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  (
    <svg key="compare" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.41251 8.18028C5.23091 7.85351 4.94594 7.5963 4.60234 7.44902C4.25874 7.30173 3.87596 7.27271 3.51408 7.36651C3.1522 7.46032 2.83171 7.67163 2.60293 7.96728C2.37414 8.26293 2.25 8.62619 2.25 9.00003C2.25 9.37387 2.37414 9.73712 2.60293 10.0328C2.83171 10.3284 3.1522 10.5397 3.51408 10.6335C3.87596 10.7273 4.25874 10.6983 4.60234 10.551C4.94594 10.4038 5.23091 10.1465 5.41251 9.81978M5.41251 8.18028C5.54751 8.42328 5.62476 8.70228 5.62476 9.00003C5.62476 9.29778 5.54751 9.57753 5.41251 9.81978M5.41251 8.18028L12.587 4.19478M5.41251 9.81978L12.587 13.8053M12.587 4.19478C12.6922 4.39288 12.8358 4.56803 13.0095 4.70998C13.1832 4.85192 13.3834 4.95782 13.5985 5.02149C13.8135 5.08515 14.0392 5.1053 14.2621 5.08075C14.4851 5.0562 14.7009 4.98745 14.897 4.87853C15.093 4.7696 15.2654 4.62267 15.404 4.44634C15.5427 4.27001 15.6448 4.06781 15.7043 3.85157C15.7639 3.63532 15.7798 3.40937 15.751 3.18693C15.7222 2.96448 15.6494 2.75 15.5368 2.55603C15.3148 2.17378 14.9518 1.89388 14.5256 1.77649C14.0995 1.6591 13.6443 1.71359 13.2579 1.92824C12.8715 2.1429 12.5848 2.50059 12.4593 2.92442C12.3339 3.34826 12.3797 3.80439 12.587 4.19478ZM12.587 13.8053C12.4794 13.9991 12.4109 14.2121 12.3856 14.4324C12.3603 14.6526 12.3787 14.8757 12.4396 15.0888C12.5005 15.3019 12.6028 15.501 12.7406 15.6746C12.8784 15.8482 13.0491 15.993 13.2429 16.1007C13.4367 16.2083 13.6498 16.2767 13.87 16.302C14.0902 16.3273 14.3133 16.309 14.5264 16.2481C14.7396 16.1872 14.9386 16.0849 15.1122 15.9471C15.2858 15.8092 15.4306 15.6386 15.5383 15.4448C15.7557 15.0534 15.8087 14.5917 15.6857 14.1613C15.5627 13.7308 15.2737 13.3668 14.8824 13.1494C14.491 12.932 14.0293 12.879 13.5989 13.002C13.1684 13.125 12.8044 13.4139 12.587 13.8053Z"
        stroke="#5C5E61"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
];

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

function formatSqFt(value: number | null | undefined): string {
  if (!value || value <= 0) return "—";
  return `${value.toLocaleString()} SqFt`;
}

function formatRooms(value: number): string {
  if (value <= 0) return "—";
  return `${value} ${value === 1 ? "Room" : "Rooms"}`;
}

function InfoDetailBox({
  iconClass,
  label,
  value,
}: {
  iconClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="box-icon">
      <div className="icons">
        <i className={iconClass} />
      </div>
      <div className="content">
        <div className="text-4 text-color-default">{label}</div>
        <div className="text-1 text-color-heading">{value}</div>
      </div>
    </div>
  );
}

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

function ListingOverview({ model }: { model: ProtyListingDetailModel }) {
  return (
    <>
      <div className="heading flex justify-between">
        <div className="title text-5 fw-6 text-color-heading reovana-blur-target">{model.title}</div>
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
        <div className="action reovana-blur-target">
          <ul className="list-action">
            {OVERVIEW_ACTION_ICONS.map((icon, index) => (
              <li key={index}>
                <a href="#" onClick={(e) => e.preventDefault()} aria-hidden="true" tabIndex={-1}>
                  {icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="info-detail reovana-blur-target">
        <div className="wrap-box">
          <InfoDetailBox iconClass="icon-HouseLine" label="ID:" value={model.listingId} />
          <InfoDetailBox iconClass="icon-Bathtub" label="Bathrooms:" value={formatRooms(model.bathrooms)} />
        </div>
        <div className="wrap-box">
          <InfoDetailBox iconClass="icon-SlidersHorizontal" label="Type:" value={model.propertyType} />
          <InfoDetailBox iconClass="icon-Crop" label="Land Size:" value={formatSqFt(model.lotSize)} />
        </div>
        <div className="wrap-box">
          <InfoDetailBox iconClass="icon-Garage-1" label="Status:" value={model.status} />
          <InfoDetailBox iconClass="icon-Hammer" label="Year Built:" value={model.yearBuilt || "—"} />
        </div>
        <div className="wrap-box">
          <InfoDetailBox iconClass="icon-Bed-2" label="Bedrooms:" value={formatRooms(model.bedrooms)} />
          <InfoDetailBox iconClass="icon-Ruler" label="Size:" value={formatSqFt(model.squareFootage)} />
        </div>
      </div>
      <Link href="/contact" className="tf-btn bg-color-primary pd-21 fw-6">
        Ask a question
      </Link>
    </>
  );
}

function SidebarAds() {
  return (
    <div className="sidebar-ads mb-30 reovana-blur-target">
      <div className="image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/home/house-db-1.jpg" alt="" />
      </div>
      <div className="logo relative z-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/reovana/logo.png" alt="REOVANA" />
      </div>
      <div className="box-ads relative z-5">
        <div className="content">
          <h4 className="title">
            <Link href="/contact">We can help you find a local real estate agent</Link>
          </h4>
          <div className="text-addres">
            <p>
              Connect with a trusted agent who knows the market inside out — whether you&apos;re
              buying or selling.
            </p>
          </div>
        </div>
        <Link href="/contact" className="tf-btn fw-6 bg-color-primary fw-6 w-full">
          Connect with an agent
        </Link>
      </div>
    </div>
  );
}

export function ProtyPropertyDetail({ model }: ProtyPropertyDetailProps) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (readListingUnlocked(model.id)) {
      setUnlocked(true);
    }
  }, [model.id]);

  useEffect(() => {
    const root = document.getElementById("listing-detail-root");
    if (!root) return;

    syncBlurTargets(root, !unlocked);

    const timer = window.setTimeout(() => syncBlurTargets(root, !unlocked), 100);
    return () => window.clearTimeout(timer);
  }, [unlocked]);

  const handleUnlock = () => {
    setUnlocked(true);
    writeListingUnlocked(model.id);
    const root = document.getElementById("listing-detail-root");
    if (root) syncBlurTargets(root, false);
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
  const photoTotal = galleryImages.length;

  return (
    <div
      id="listing-detail-root"
      className={`reovana-listing-detail main-content${unlocked ? " reovana-listing-detail--unlocked" : " reovana-listing-detail--locked"}`}
    >
      <RecordRecentlyViewed {...model.recentlyViewed} />

      <section className="flat-title">
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
                  <li className="reovana-blur-target">{model.title}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`section-property-image reovana-listing-gallery${singlePhoto ? " reovana-listing-detail__gallery--single" : ""}`}
      >
        <div className="tf-container">
          <div className="row">
            <div className="col-12">
              {singlePhoto ? (
                <div className="wrap-image">
                  <div className="image img-1">
                    <span className="image-wrap relative d-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mainImage} alt={model.title} />
                    </span>
                    <GalleryPhotoTag current={1} total={photoTotal} />
                  </div>
                </div>
              ) : (
                <div className="wrap-image">
                  <div className="image img-1">
                    <span className="image-wrap relative d-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mainImage} alt={model.title} />
                    </span>
                    <GalleryPhotoTag current={1} total={photoTotal} />
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

      <div className="tf-container">
        <div className="row">
          <div className="col-xl-8 col-lg-7">
            <ListingUnlockPaywall unlocked={unlocked} onUnlock={handleUnlock} />
          </div>
        </div>
      </div>

      <section className="section-property-detail">
        <div className="tf-container">
          <div className="row">
            <div className="col-xl-8 col-lg-7">
              <div className="wg-property box-overview">
                <ListingOverview model={model} />
              </div>

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

              {amenityColumns.length > 0 ? (
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
              ) : null}

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
              <div className="tf-sidebar sticky-sidebar">
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

                <SidebarAds />

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
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M18.125 5.625V14.375C18.125 14.8723 17.9275 15.3492 17.5758 15.7008C17.2242 16.0525 16.7473 16.25 16.25 16.25H3.75C3.25272 16.25 2.77581 16.0525 2.42417 15.7008C2.07254 15.3492 1.875 14.8723 1.875 14.375V5.625M18.125 5.625C18.125 5.12772 17.9275 4.65081 17.5758 4.29917C17.2242 3.94754 16.7473 3.75 16.25 3.75H3.75C3.25272 3.75 2.77581 3.94754 2.42417 4.29917C2.07254 4.65081 1.875 5.12772 1.875 5.625M18.125 5.625V5.8275C18.125 6.14762 18.0431 6.46242 17.887 6.74191C17.7309 7.0214 17.5059 7.25628 17.2333 7.42417L10.9833 11.27C10.6877 11.4521 10.3472 11.5485 10 11.5485C9.65275 11.5485 9.31233 11.4521 9.01667 11.27L2.76667 7.425C2.4941 7.25711 2.26906 7.02224 2.11297 6.74275C1.95689 6.46325 1.87496 6.14845 1.875 5.82833V5.625"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
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
