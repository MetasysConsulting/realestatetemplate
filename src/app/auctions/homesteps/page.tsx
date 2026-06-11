import type { Metadata } from "next";
import { HomeStepsPageContent } from "@/components/auctions/HomeStepsPageContent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Freddie Mac HomeSteps — REOVANA",
  description: "Browse Freddie Mac HomeSteps REO foreclosure listings nationwide.",
};

export default function HomeStepsPage() {
  return <HomeStepsPageContent />;
}
