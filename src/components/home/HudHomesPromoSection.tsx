import Link from "next/link";

const APPRAISAL_AGENT_IMAGE = "/images/reovana/appraisal-agent.png";

export function HudHomesPromoSection() {
  return (
    <section className="section-work-together reovana-hud-promo" aria-label="Appraisal call to action">
      <div className="wg-partner reovana-hud-promo__grey-band" aria-hidden="true" />

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
                Thousands of investors visit our website.
              </p>
            </div>
            <Link href="/add-property" className="tf-btn bg-color-primary fw-7 pd-11">
              Post Your Property
            </Link>
            <div className="person reovana-hud-promo__agent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={APPRAISAL_AGENT_IMAGE} alt="" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </div>

      <div className="reovana-hud-promo__light-band" aria-hidden="true" />
    </section>
  );
}
