import type { Metadata } from "next";
import { VrmPropertiesPageContent } from "@/components/auctions/VrmPropertiesPageContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "VA REO Homes — REOVANA",
  description: "Browse VA REO foreclosure homes from VRM Properties nationwide.",
};

export default async function VaReoPage() {
  return <VrmPropertiesPageContent />;
}
