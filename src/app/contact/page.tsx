import { SiteLayout } from "@/components/layout/SiteLayout";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <SiteLayout>
      <div className="page-title style-1">
        <div className="tf-container">
          <h1 className="title">Contact us</h1>
          <p className="text-1">We&apos;d love to help you find your next home in Hawaii.</p>
        </div>
      </div>
      <section className="tf-spacing-1">
        <div className="tf-container">
          <div className="row g-30">
            <div className="col-lg-5">
              <div className="contact-item mb-20">
                <div className="icons">
                  <i className="icon-phone-2" />
                </div>
                <div className="content">
                  <div className="title text-1">Phone</div>
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
                  <div className="title text-1">Email</div>
                  <h6>
                    <a href="mailto:hello@proty.hawaii">hello@proty.hawaii</a>
                  </h6>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <form className="form-contact" action="#" method="post">
                <div className="row g-20">
                  <div className="col-md-6">
                    <fieldset>
                      <input type="text" name="name" placeholder="Your name" required />
                    </fieldset>
                  </div>
                  <div className="col-md-6">
                    <fieldset>
                      <input type="email" name="email" placeholder="Email" required />
                    </fieldset>
                  </div>
                  <div className="col-12">
                    <fieldset>
                      <input type="text" name="subject" placeholder="Subject" />
                    </fieldset>
                  </div>
                  <div className="col-12">
                    <fieldset>
                      <textarea name="message" rows={5} placeholder="Message" required />
                    </fieldset>
                  </div>
                  <div className="col-12">
                    <button type="submit" className="tf-btn bg-color-primary pd-23">
                      Send message
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
