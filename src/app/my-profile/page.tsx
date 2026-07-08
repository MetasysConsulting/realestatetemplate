import type { Metadata } from "next";
import { AccountSettingsForm } from "@/components/auth/AccountSettingsForm";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export const metadata: Metadata = {
  title: "Account Settings — REOVANA",
};

export default function MyProfilePage() {
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
                <h1 className="reovana-account-page__title">Account settings</h1>
                <p className="reovana-account-page__subtitle">
                  Manage your profile details for REOVANA.
                </p>
              </div>
              <AccountSettingsForm />
            </div>
          </div>
        </div>
      </section>
    </TemplateChrome>
  );
}
