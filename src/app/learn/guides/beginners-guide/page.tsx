import type { Metadata } from "next";
import { LearnArticleView } from "@/components/learn/LearnArticleView";
import { LearnPageShell } from "@/components/learn/LearnPageShell";
import { BLOG_ARTICLE_BEGINNERS } from "@/lib/learn-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Beginner's guide to foreclosed homes — REOVANA",
  description:
    "What to expect at each stage of buying distressed property, from pre-foreclosure to auction to bank-owned.",
};

export default function BeginnersGuidePage() {
  return (
    <LearnPageShell>
      <LearnArticleView article={BLOG_ARTICLE_BEGINNERS} />
    </LearnPageShell>
  );
}
