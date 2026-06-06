import type { Metadata } from "next";
import { LearnHub } from "@/components/learn/LearnHub";
import { LearnPageShell } from "@/components/learn/LearnPageShell";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Learn — REOVANA",
  description:
    "Guides, glossary, help center, and FAQs for buying distressed property on REOVANA.",
};

export default function LearnOverviewPage() {
  return (
    <LearnPageShell>
      <LearnHub />
    </LearnPageShell>
  );
}
