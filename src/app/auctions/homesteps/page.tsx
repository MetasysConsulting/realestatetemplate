import type { Metadata } from "next";
import { HomeStepsPageContent } from "@/components/auctions/HomeStepsPageContent";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Freddie Mac HomeSteps — REOVANA",
  description: "Browse Freddie Mac HomeSteps REO foreclosure listings nationwide.",
};

export default async function HomeStepsPage() {
  return <HomeStepsPageContent />;
}
