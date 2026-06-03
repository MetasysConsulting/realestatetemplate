import { SiteLayout } from "@/components/layout/SiteLayout";

const faqs = [
  {
    q: "How do I schedule a property tour?",
    a: "Contact us via the form on the Contact page or call (808) 555-0123. An agent will confirm your visit within one business day.",
  },
  {
    q: "Do you list rentals as well as sales?",
    a: "Yes. Use the search bar on the home page and toggle between For sale and For rent, or browse all listings on the Properties page.",
  },
  {
    q: "Which islands do you cover?",
    a: "Our demo listings focus on Oahu and Maui, but the template is ready to expand across all Hawaiian islands.",
  },
];

export const metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <SiteLayout>
      <div className="page-title style-1">
        <div className="tf-container">
          <h1 className="title">Frequently asked questions</h1>
        </div>
      </div>
      <section className="tf-spacing-1">
        <div className="tf-container">
          <div className="row justify-center">
            <div className="col-lg-8">
              {faqs.map((item) => (
                <div key={item.q} className="mb-24">
                  <h5 className="title mb-8">{item.q}</h5>
                  <p className="text-1">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
