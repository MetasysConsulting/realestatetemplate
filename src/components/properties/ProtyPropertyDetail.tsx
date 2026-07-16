"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { RecordRecentlyViewed } from "@/components/home/RecordRecentlyViewed";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { ListingGallery } from "@/components/properties/ListingGallery";
import { ListingUnlockPaywall } from "@/components/properties/ListingUnlockPaywall";
import {
  formatMoney,
  formatMoneyExact,
  monthlyPiPayment,
} from "@/lib/loan-calculator-math";
import type { ProtyListingDetailModel } from "@/lib/proty-listing-detail";
import { syncBlurTargets, trackUnlockIntent } from "@/lib/property-gate";

type ProtyPropertyDetailProps = {
  model: ProtyListingDetailModel;
  unlocked?: boolean;
  isAdminBypass?: boolean;
  initialFavorited?: boolean;
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

function dash(value: string | number | null | undefined): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return "—";
    return value.toLocaleString();
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : "—";
}

function pricePerSqFt(price: number, sqft: number): string {
  if (!(price > 0) || !(sqft > 0)) return "—";
  return formatMoney(Math.round(price / sqft));
}

function Section({
  id,
  title,
  children,
  empty,
}: {
  id?: string;
  title: string;
  children?: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <section id={id} className="homes-section">
      <h2 className="homes-section__title">{title}</h2>
      {empty ? <p className="homes-section__empty">—</p> : children}
    </section>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="homes-facts__row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OwnerContactBlock({
  owner,
  unlocked,
}: {
  owner: NonNullable<ProtyListingDetailModel["ownerContact"]>;
  unlocked: boolean;
}) {
  return (
    <section className={`homes-section homes-owner${unlocked ? "" : " reovana-blur-target"}`}>
      <h2 className="homes-section__title">Owner information</h2>
      <div className="homes-owner__grid">
        <FactRow label="Owner" value={dash(owner.name)} />
        <FactRow label="Phone" value={dash(owner.phone)} />
        <FactRow label="Email" value={dash(owner.email)} />
      </div>
      {!unlocked ? (
        <p className="homes-owner__hint">Unlock this listing to reveal owner contact details.</p>
      ) : null}
    </section>
  );
}

function ListingPaymentCalculator({ price }: { price: number }) {
  const [homePrice, setHomePrice] = useState(price > 0 ? String(Math.round(price)) : "");
  const [downPct, setDownPct] = useState("20");
  const [rate, setRate] = useState("6.5");
  const [termYears, setTermYears] = useState("30");

  const result = useMemo(() => {
    const P = Number(String(homePrice).replace(/[$,\s]/g, ""));
    const down = Number(downPct);
    const annual = Number(rate);
    const years = Number(termYears);
    if (!(P > 0) || !Number.isFinite(down) || !Number.isFinite(annual) || !(years > 0)) {
      return null;
    }
    const downPayment = P * (Math.min(90, Math.max(0, down)) / 100);
    const loan = Math.max(0, P - downPayment);
    const pi = monthlyPiPayment(loan, annual, years);
    const tax = (P * 0.012) / 12;
    const insurance = (P * 0.0035) / 12;
    const total = pi + tax + insurance;
    return { loan, downPayment, pi, tax, insurance, total };
  }, [homePrice, downPct, rate, termYears]);

  return (
    <div className="homes-payment">
      <div className="homes-payment__inputs">
        <label>
          <span>Home price</span>
          <input value={homePrice} onChange={(e) => setHomePrice(e.target.value)} inputMode="decimal" />
        </label>
        <label>
          <span>Down payment %</span>
          <input value={downPct} onChange={(e) => setDownPct(e.target.value)} inputMode="decimal" />
        </label>
        <label>
          <span>Interest rate %</span>
          <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </label>
        <label>
          <span>Loan term (years)</span>
          <input value={termYears} onChange={(e) => setTermYears(e.target.value)} inputMode="decimal" />
        </label>
      </div>
      {result ? (
        <div className="homes-payment__results">
          <div className="homes-payment__hero">
            <span>Est. payment</span>
            <strong>{formatMoneyExact(result.total)}/mo</strong>
          </div>
          <div className="homes-payment__breakdown">
            <FactRow label="Principal & interest" value={formatMoneyExact(result.pi)} />
            <FactRow label="Est. property tax" value={formatMoneyExact(result.tax)} />
            <FactRow label="Est. home insurance" value={formatMoneyExact(result.insurance)} />
            <FactRow label="Loan amount" value={formatMoney(result.loan)} />
            <FactRow label="Down payment" value={formatMoney(result.downPayment)} />
          </div>
          <p className="homes-payment__note">
            Tax and insurance are rough national averages (~1.2% and ~0.35% of price / year). Not a
            lender quote.{" "}
            <Link href="/loans/calculators">Open full calculators</Link>
          </p>
        </div>
      ) : (
        <p className="homes-section__empty">Enter a price to estimate payment.</p>
      )}
    </div>
  );
}

export function ProtyPropertyDetail({
  model,
  unlocked = false,
  isAdminBypass = false,
  initialFavorited = false,
}: ProtyPropertyDetailProps) {
  const applyBlurState = useEffectEvent((isUnlocked: boolean) => {
    const root = document.getElementById("listing-detail-root");
    if (!root) return;
    syncBlurTargets(root, !isUnlocked);
  });

  useEffect(() => {
    applyBlurState(unlocked);
    const timer = window.setTimeout(() => applyBlurState(unlocked), 100);
    return () => window.clearTimeout(timer);
  }, [unlocked]);

  const mapUrl = useMemo(
    () => (model.hasRealCoordinates ? buildMapEmbedUrl(model) : ""),
    [model],
  );

  const estPayment = useMemo(() => {
    if (!(model.priceNumeric > 0)) return null;
    const loan = model.priceNumeric * 0.8;
    const pi = monthlyPiPayment(loan, 6.5, 30);
    const tax = (model.priceNumeric * 0.012) / 12;
    const insurance = (model.priceNumeric * 0.0035) / 12;
    return pi + tax + insurance;
  }, [model.priceNumeric]);

  const aboutText = model.description?.trim() || "";
  const hasAbout =
    aboutText.length > 0 &&
    !aboutText.toLowerCase().startsWith("tbd") &&
    aboutText !== "—";

  const propertyFactRows = [
    { label: "Home type", value: dash(model.propertyType) },
    { label: "Status", value: dash(model.status) },
    { label: "Bedrooms", value: model.bedrooms > 0 ? String(model.bedrooms) : "—" },
    { label: "Bathrooms", value: model.bathrooms > 0 ? String(model.bathrooms) : "—" },
    {
      label: "Square footage",
      value: model.squareFootage > 0 ? `${model.squareFootage.toLocaleString()} Sq Ft` : "—",
    },
    {
      label: "Price per sq ft",
      value: pricePerSqFt(model.priceNumeric, model.squareFootage),
    },
    { label: "Year built", value: dash(model.yearBuilt) },
    {
      label: "Lot size",
      value: model.lotSize && model.lotSize > 0 ? `${model.lotSize.toLocaleString()} Sq Ft` : "—",
    },
    { label: "Listing ID", value: dash(model.listingId) },
    { label: "Category", value: dash(model.categoryLabel) },
    ...model.detailFacts
      .filter(
        (f) =>
          !["Property Type", "Status", "Year Built", "Land Size"].includes(f.label),
      )
      .map((f) => ({ label: f.label, value: dash(f.value) })),
  ];

  return (
    <div
      id="listing-detail-root"
      className={`reovana-listing-detail homes-listing main-content${unlocked ? " reovana-listing-detail--unlocked" : " reovana-listing-detail--locked"}`}
    >
      <RecordRecentlyViewed {...model.recentlyViewed} />

      <section className="homes-breadcrumb">
        <div className="tf-container">
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href={model.backHref}>{model.backLabel}</Link>
            </li>
            <li>{model.title}</li>
          </ul>
        </div>
      </section>

      <section className="section-property-image homes-gallery">
        <div className="tf-container">
          <ListingGallery images={model.galleryImages} alt={model.title} />
        </div>
      </section>

      <section className="homes-body">
        <div className="tf-container">
          <div className="homes-layout">
            <div className="homes-main">
              <header className="homes-hero">
                <div className="homes-hero__top">
                  <div>
                    <p className="homes-hero__price">{model.priceDisplay}</p>
                    {model.priceLabel ? (
                      <p className="homes-hero__price-label">{model.priceLabel}</p>
                    ) : null}
                  </div>
                  <div className="homes-hero__actions">
                    <span className="homes-hero__status">{dash(model.status)}</span>
                    <FavoriteButton
                      listingId={model.id}
                      initialFavorited={initialFavorited}
                      className="reovana-favorite-btn--inline"
                    />
                  </div>
                </div>

                <h1 className="homes-hero__address">{model.title}</h1>
                <p className="homes-hero__location">
                  {model.mapCity}, {model.mapState} {model.mapZip}
                  {model.mapCounty ? ` · ${model.mapCounty}` : ""}
                </p>

                {estPayment != null ? (
                  <p className="homes-hero__payment">
                    Estimated payment{" "}
                    <strong>{formatMoney(Math.round(estPayment))}/month</strong>
                    <a href="#mortgage-calculator">Adjust estimate</a>
                  </p>
                ) : null}

                <div className="homes-stats">
                  <div>
                    <strong>{model.bedrooms > 0 ? model.bedrooms : "—"}</strong>
                    <span>Beds</span>
                  </div>
                  <div>
                    <strong>{model.bathrooms > 0 ? model.bathrooms : "—"}</strong>
                    <span>Baths</span>
                  </div>
                  <div>
                    <strong>
                      {model.squareFootage > 0
                        ? model.squareFootage.toLocaleString()
                        : "—"}
                    </strong>
                    <span>Sq Ft</span>
                  </div>
                  <div>
                    <strong>{pricePerSqFt(model.priceNumeric, model.squareFootage)}</strong>
                    <span>Price / Sq Ft</span>
                  </div>
                </div>
              </header>

              <Section title="About This Home" empty={!hasAbout}>
                {hasAbout ? <p className="homes-about">{aboutText}</p> : null}
              </Section>

              <Section title="Property Details">
                <div className="homes-facts">
                  {propertyFactRows.map((row) => (
                    <FactRow key={row.label} label={row.label} value={row.value} />
                  ))}
                </div>
              </Section>

              {model.ownerContact ? (
                <OwnerContactBlock owner={model.ownerContact} unlocked={unlocked} />
              ) : null}

              <Section
                title="Amenities And Features"
                empty={model.amenities.length === 0}
              >
                <ul className="homes-amenities">
                  {model.amenities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Section>

              <Section title="Map" empty={!model.hasRealCoordinates}>
                {model.hasRealCoordinates ? (
                  <div className="homes-map">
                    <iframe
                      className="map reovana-listing-detail__map"
                      src={mapUrl}
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map for ${model.title}`}
                    />
                    <p className="homes-map__address">{model.locationLine}</p>
                  </div>
                ) : null}
              </Section>

              <Section title="Explore this Neighborhood" empty />
              <Section title="Schools" empty />
              <Section title="Tax History" empty />
              <Section title="Property History" empty />

              <Section id="mortgage-calculator" title="Mortgage Payment Calculator">
                <ListingPaymentCalculator price={model.priceNumeric} />
              </Section>

              <div className="homes-cta-row">
                <Link href="/loans/find" className="tf-btn bg-color-primary pd-21 fw-6">
                  Find a Loan for this property
                </Link>
                <Link href="/contact" className="tf-btn btn-border pd-21 fw-6">
                  Ask a question
                </Link>
              </div>

              {model.disclaimer ? (
                <p className="reovana-listing-detail__disclaimer">{model.disclaimer}</p>
              ) : null}
            </div>

            <aside className="homes-sidebar">
              <div className="tf-sidebar sticky-sidebar">
                <ListingUnlockPaywall
                  unlocked={unlocked}
                  listingId={model.id}
                  hasOwnerContact={Boolean(model.ownerContact)}
                  onUnlocked={() => {
                    trackUnlockIntent(model.id, isAdminBypass ? "admin" : "paid");
                  }}
                />

                <div className="homes-sidebar-card">
                  <h3>Need financing?</h3>
                  <p>
                    Get a formula-based investor loan estimate and send your deal to the REOVANA
                    team.
                  </p>
                  <Link href="/loans/find" className="tf-btn bg-color-primary w-full fw-6">
                    Find a Loan
                  </Link>
                </div>

                <div className="homes-sidebar-card">
                  <h3>Questions about this listing?</h3>
                  <p>Our team can help you understand distressed inventory and next steps.</p>
                  <Link href="/contact" className="tf-btn btn-border w-full fw-6">
                    Contact REOVANA
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
