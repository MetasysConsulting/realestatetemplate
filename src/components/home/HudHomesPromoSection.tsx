import Link from "next/link";

const APPRAISAL_AGENT_IMAGE = "/images/reovana/appraisal-agent.png";

export function HudHomesPromoSection() {
  return (
    <section className="section-work-together reovana-hud-promo" aria-label="Partner and appraisal call to action">
      <div className="wg-partner tf-spacing-1">
        <div className="tf-container">
          <div className="heading-section text-center mb-48 reovana-hud-promo__intro">
            <h2 className="title text_white">Let&apos;s Work Together</h2>
            <p className="text-1 text_white">
              Thousands of luxury home enthusiasts just like you visit our website.
            </p>
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
            <div className="person reovana-hud-promo__agent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={APPRAISAL_AGENT_IMAGE} alt="" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
