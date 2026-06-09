import type { Metadata } from "next";
import { HudHomesPageContent } from "@/components/auctions/HudHomesPageContent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "HUD Homes — REOVANA",
  description:
    "Browse HUD foreclosure homes for sale nationwide from HUD HomeStore listings.",
};

export default function HudHomesPage() {
  return <HudHomesPageContent />;
}
