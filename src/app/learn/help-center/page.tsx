import type { Metadata } from "next";
import { HelpCenterExplorer } from "@/components/learn/HelpCenterExplorer";
import { LearnPageShell } from "@/components/learn/LearnPageShell";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Help Center — REOVANA",
  description: "Get help browsing foreclosure auctions, FAQs, and support on REOVANA.",
};

export default function HelpCenterPage() {
  return (
    <LearnPageShell>
      <HelpCenterExplorer />
    </LearnPageShell>
  );
}
