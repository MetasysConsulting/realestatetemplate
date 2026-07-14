import type { Metadata } from "next";
import { BillingPanel } from "@/components/auth/BillingPanel";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Billing — REOVANA",
};

export default function BillingPage() {
  const home = loadTemplatePageBySlug("index");
  const chrome = home
    ? extractTemplateChrome(home.html)
    : { headerHtml: "", footerHtml: "", tailHtml: "" };

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass="theme-color-4"
    >
      <section className="reovana-account-page">
        <div className="tf-container xl">
          <div className="row justify-content-center">
            <div className="col-12 col-xl-8">
              <div className="reovana-account-page__header">
                <h1 className="reovana-account-page__title">Billing</h1>
                <p className="reovana-account-page__subtitle">
                  See your REOVANA plan and manage or cancel your Stripe subscription.
                </p>
              </div>
              <BillingPanel />
            </div>
          </div>
        </div>
      </section>
    </TemplateChrome>
  );
}
