import type { Metadata } from "next";
import { SellPageContent } from "@/components/sell/SellPageContent";
import { SellPageShell } from "@/components/sell/SellPageShell";

export const metadata: Metadata = {
  title: "Sell — REOVANA",
  description:
    "List your distressed property on REOVANA.com. Connect with cash buyers, investors, and real estate professionals nationwide.",
};

export default function SellPage() {
  return (
    <SellPageShell>
      <SellPageContent />
    </SellPageShell>
  );
}
