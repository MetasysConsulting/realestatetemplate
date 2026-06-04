import type { Metadata } from "next";
import { AuctionsExplorer } from "@/components/auctions/AuctionsExplorer";
import { TemplateChrome } from "@/components/template/TemplateChrome";
import { extractTemplateChrome } from "@/lib/extract-template-chrome";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export const metadata: Metadata = {
  title: "All Auctions — REOVANA",
  description: "Browse foreclosed and auction properties across the United States.",
};

export default function AuctionsPage() {
  const home = loadTemplatePageBySlug("index");
  const chrome = home ? extractTemplateChrome(home.html) : { headerHtml: "", footerHtml: "", tailHtml: "" };

  return (
    <TemplateChrome
      headerHtml={chrome.headerHtml}
      footerHtml={chrome.footerHtml}
      tailHtml={chrome.tailHtml}
      bodyClass="theme-color-4 auctions-route"
    >
      <AuctionsExplorer />
    </TemplateChrome>
  );
}
