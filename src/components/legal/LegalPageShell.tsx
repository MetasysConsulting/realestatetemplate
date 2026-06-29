import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

type LegalPageShellProps = {
  children: React.ReactNode;
};

export function LegalPageShell({ children }: LegalPageShellProps) {
  const home = loadTemplatePageBySlug("index");
  const chrome = home
    ? extractTemplateChrome(home.html)
    : { headerHtml: "", footerHtml: "", tailHtml: "" };

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass="theme-color-4 learn-route legal-route"
    >
      <div className="learn-page legal-page">
        <div className="tf-container">{children}</div>
      </div>
    </TemplateChrome>
  );
}
