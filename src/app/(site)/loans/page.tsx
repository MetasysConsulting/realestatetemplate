import type { Metadata } from "next";
import { LoansPageContent } from "@/components/loans/LoansPageContent";
import { LoansPageShell } from "@/components/loans/LoansPageShell";

export const metadata: Metadata = {
  title: "Loans — REOVANA",
  description:
    "Find investor and hard money loans for distressed properties. Connect with vetted lenders and fast funding solutions.",
};

export default function LoansPage() {
  return (
    <LoansPageShell>
      <LoansPageContent />
    </LoansPageShell>
  );
}
