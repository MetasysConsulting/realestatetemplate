import Link from "next/link";

const HUD_PARTNERS = [
  "HUD",
  "FHA",
  "USDA",
  "VA Loans",
  "Fannie Mae",
  "Freddie Mac",
];

const PROMO_HOUSE_IMAGE = "/images/reovana/hero-house.jpeg";

export function HudHomesPromoSection() {
  return (
    <section className="section-work-together reovana-hud-promo" aria-label="HUD homes resources">
      <div className="wg-partner tf-spacing-1">
        <div className="tf-container">
          <div className="heading-section text-center mb-48">
            <h2 className="title text_white">Let&apos;s Work Together</h2>
            <p className="text-1 text_white">
              Thousands of luxury home enthusiasts just like you visit our website.
            </p>
          </div>
          <div className="reovana-hud-promo__partners">
            {HUD_PARTNERS.map((name) => (
              <div key={name} className="partner-item style-2 reovana-hud-promo__partner">
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wg-appraisal">
        <div className="tf-container">
          <div className="content">
            <div className="heading-section mb-30">
              <h2 className="title">
                Are You Selling Or
                <br />
                Renting Your Property?
              </h2>
              <p className="text-1">
                Thousands of luxury home enthusiasts just like you visit our website.
              </p>
            </div>
            <Link href="/contact" className="tf-btn bg-color-primary fw-7 pd-11">
              Request your free appraisal
            </Link>
            <div className="person reovana-hud-promo__house">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PROMO_HOUSE_IMAGE} alt="" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
