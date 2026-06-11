import type { Metadata } from "next";
import { GsaRealEstateSalesPageContent } from "@/components/auctions/GsaRealEstateSalesPageContent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Federal Property Auctions — REOVANA",
  description:
    "Browse surplus federal real property auctions from GSA Real Estate Sales.",
};

export default function FederalPropertyAuctionsPage() {
  return <GsaRealEstateSalesPageContent />;
}
