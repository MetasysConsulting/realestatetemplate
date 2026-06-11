import type { Metadata } from "next";
import { VrmPropertiesPageContent } from "@/components/auctions/VrmPropertiesPageContent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "VA REO Homes — REOVANA",
  description: "Browse VA REO foreclosure homes from VRM Properties nationwide.",
};

export default function VaReoPage() {
  return <VrmPropertiesPageContent />;
}
