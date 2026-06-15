import Link from "next/link";

const HUD_PARTNERS = [
  "HUD",
  "FHA",
  "USDA",
  "VA Loans",
  "Fannie Mae",
  "Freddie Mac",
];

export function HudHomesPromoSection() {
  return (
    <section className="section-work-together reovana-hud-promo" aria-label="HUD homes resources">
      <div className="wg-partner tf-spacing-1">
        <div className="tf-container">
          <div className="heading-section text-center mb-48">
            <h2 className="title text_white">Let&apos;s Work Together</h2>
            <p className="text-1 text_white">
              REOVANA connects buyers with HUD foreclosure inventory and the tools to bid with
              confidence.
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
                Ready to Buy a
                <br />
                HUD Foreclosure?
              </h2>
              <p className="text-1">
                Browse FHA-insured HUD homes nationwide. Bids require a HUD-registered broker — we
                help you find properties and understand the process.
              </p>
            </div>
            <Link href="/properties/hud-home" className="tf-btn bg-color-primary fw-7 pd-11">
              Browse HUD homes
            </Link>
            <div className="person">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/section/person-1.png" alt="" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
