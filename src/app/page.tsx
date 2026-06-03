import Link from "next/link";
import { HeroSearch } from "@/components/home/HeroSearch";
import { PropertySlider } from "@/components/home/PropertySlider";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { properties } from "@/lib/properties";

export default function HomePage() {
  return (
    <SiteLayout>
      <HeroSearch />

      <PropertySlider properties={properties} />

      <section className="section-benefit tf-spacing-1">
        <div className="tf-container">
          <div className="row">
            <div className="col-lg-6">
              <div className="heading-section">
                <h2 className="title">Why choose Proty</h2>
                <p className="text-1">
                  Local expertise, luxury listings, and a seamless search
                  experience tailored for Hawaii&apos;s market.
                </p>
              </div>
              <ul className="list-benefit">
                <li>
                  <i className="icon-check" />
                  <span>Verified luxury listings across the islands</span>
                </li>
                <li>
                  <i className="icon-check" />
                  <span>Dedicated agents for buy &amp; rent</span>
                </li>
                <li>
                  <i className="icon-check" />
                  <span>Blue-branded experience — built on Next.js</span>
                </li>
              </ul>
              <Link href="/properties" className="tf-btn bg-color-primary pd-23">
                Browse all listings
              </Link>
            </div>
            <div className="col-lg-6">
              <img
                src="/images/section/box-house-2.jpg"
                alt="Luxury home"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-cta tf-spacing-1" style={{ background: "var(--Sub-primary-1)" }}>
        <div className="tf-container text-center">
          <h2 className="title">Ready to find your island home?</h2>
          <p className="text-1 mb-20">
            Talk to our team or explore featured properties today.
          </p>
          <Link href="/contact" className="tf-btn bg-color-primary pd-23">
            Get in touch
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
