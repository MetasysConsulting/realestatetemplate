import type { Metadata } from "next";
import { FaqExplorer } from "@/components/learn/FaqExplorer";
import { LearnPageShell } from "@/components/learn/LearnPageShell";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "FAQ — REOVANA Learn",
  description: "Frequently asked questions about REOVANA, listings, and unlocking details.",
};

export default function LearnFaqPage() {
  return (
    <LearnPageShell>
      <FaqExplorer />
    </LearnPageShell>
  );
}
