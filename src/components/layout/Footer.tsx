import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer style-1">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            <div className="footer-top">
              <div className="footer-logo">
                <Link href="/">
                  <img
                    id="logo_footer"
                    src="/images/logo/logo-2@2x.png"
                    alt="Proty"
                  />
                </Link>
              </div>
              <div className="wrap-contact-item">
                <div className="contact-item">
                  <div className="icons">
                    <i className="icon-phone-2" />
                  </div>
                  <div className="content">
                    <div className="title text-1">Call us</div>
                    <h6>
                      <a href="tel:+18085550123">(808) 555-0123</a>
                    </h6>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="icons">
                    <i className="icon-letter-2" />
                  </div>
                  <div className="content">
                    <div className="title text-1">Need live help</div>
                    <h6 className="fw-4">
                      <a href="mailto:hello@proty.hawaii">hello@proty.hawaii</a>
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-main">
            <div className="row">
              <div className="col-lg-3 col-md-6">
                <div className="footer-menu-list footer-col-block style-2">
                  <h5 className="title lh-30">About us</h5>
                  <ul className="tf-collapse-content">
                    <li>
                      <Link href="/contact">Contact</Link>
                    </li>
                    <li>
                      <Link href="/agents">Our team</Link>
                    </li>
                    <li>
                      <Link href="/faq">FAQs</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="footer-menu-list footer-col-block">
                  <h5 className="title lh-30">Popular homes</h5>
                  <ul className="tf-collapse-content">
                    <li>
                      <Link href="/properties">Penthouses</Link>
                    </li>
                    <li>
                      <Link href="/properties">Villas</Link>
                    </li>
                    <li>
                      <Link href="/properties">Apartments</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="footer-menu-list footer-col-block style-2">
                  <h5 className="title lh-30">Quick links</h5>
                  <ul className="tf-collapse-content">
                    <li>
                      <Link href="/properties">Listings</Link>
                    </li>
                    <li>
                      <Link href="/blog">Blog</Link>
                    </li>
                    <li>
                      <Link href="/contact">Contact support</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="footer-menu-list newsletter">
                  <h5 className="title lh-30 mb-19">Newsletter</h5>
                  <p className="text-1">Sign up for the latest listings in Hawaii.</p>
                  <form className="mt-12" action="#" method="post">
                    <fieldset className="email">
                      <input
                        className="input input-nl"
                        type="email"
                        name="email"
                        placeholder="Your email address"
                        required
                      />
                    </fieldset>
                    <button
                      type="submit"
                      className="tf-btn bg-color-primary w-full mt-12"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              © {new Date().getFullYear()} Proty Real Estate. Built with Next.js
              from the Proty HTML template.
            </p>
            <ul className="tf-social style-2">
              <li>
                <a href="#" aria-label="Facebook">
                  <i className="icon-fb" />
                </a>
              </li>
              <li>
                <a href="#" aria-label="X">
                  <i className="icon-X" />
                </a>
              </li>
              <li>
                <a href="#" aria-label="LinkedIn">
                  <i className="icon-linked" />
                </a>
              </li>
              <li>
                <a href="#" aria-label="Instagram">
                  <i className="icon-ins" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
