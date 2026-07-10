import type { Metadata } from "next";
import { LearnArticleView } from "@/components/learn/LearnArticleView";
import { LearnPageShell } from "@/components/learn/LearnPageShell";
import { HELP_ARTICLE_UNLOCKING } from "@/lib/learn-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "How unlocking works — REOVANA Help",
  description:
    "What you see for free on REOVANA listings, what unlocking reveals, and how billing works.",
};

export default function UnlockingListingDetailsPage() {
  return (
    <LearnPageShell>
      <LearnArticleView article={HELP_ARTICLE_UNLOCKING} />
    </LearnPageShell>
  );
}
