import type { Metadata } from "next";
import { GlossaryExplorer } from "@/components/learn/GlossaryExplorer";
import { LearnPageShell } from "@/components/learn/LearnPageShell";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Glossary — REOVANA",
  description: "Foreclosure and auction terminology for buyers on REOVANA.",
};

export default function GlossaryPage() {
  return (
    <LearnPageShell>
      <GlossaryExplorer />
    </LearnPageShell>
  );
}
