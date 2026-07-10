import type { Metadata } from "next";
import { GsaRealEstateSalesPageContent } from "@/components/auctions/GsaRealEstateSalesPageContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Federal Property Auctions — REOVANA",
  description:
    "Browse surplus federal real property auctions from GSA Real Estate Sales.",
};

export default async function FederalPropertyAuctionsPage() {
  return <GsaRealEstateSalesPageContent />;
}
