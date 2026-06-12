import type { Metadata } from "next";
import { HudHomesPageContent } from "@/components/auctions/HudHomesPageContent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "HUD Homes — REOVANA",
  description:
    "Browse FHA-insured HUD foreclosure homes nationwide — listed exclusively on REOVANA.",
};

export default function HudHomeCategoryPage() {
  return <HudHomesPageContent />;
}
