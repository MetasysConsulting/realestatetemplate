import type { Metadata } from "next";
import { AuctionsPageContent } from "@/components/auctions/AuctionsPageContent";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All Auction Homes — REOVANA",
  description: "Browse foreclosed and auction properties across the United States.",
};

export default async function AuctionsPage() {
  return <AuctionsPageContent categoryKey="all" />;
}
