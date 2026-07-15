import { TemplateChrome } from "@/components/template/TemplateChrome";
import { MemberSidebar } from "@/components/member/MemberSidebar";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import { getMemberNavCounts } from "@/lib/member/nav-counts";

type MemberDashboardShellProps = {
  activeHref: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export async function MemberDashboardShell({
  activeHref,
  title,
  subtitle,
  children,
}: MemberDashboardShellProps) {
  const home = loadTemplatePageBySlug("index");
  const chrome = home
    ? extractTemplateChrome(home.html)
    : { headerHtml: "", footerHtml: "", tailHtml: "" };
  const counts = await getMemberNavCounts();

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass="theme-color-4 bg-dashboard"
    >
      <div className="reovana-member-dash">
        <MemberSidebar activeHref={activeHref} counts={counts} />
        <div className="reovana-member-dash__main">
          <header className="reovana-member-dash__header">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </header>
          {children}
        </div>
      </div>
    </TemplateChrome>
  );
}
