import type { Metadata } from "next";
import { BillingPanel } from "@/components/auth/BillingPanel";
import { MemberDashboardShell } from "@/components/member/MemberDashboardShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Billing — REOVANA",
};

export default function BillingPage() {
  return (
    <MemberDashboardShell
      activeHref="/billing"
      title="Billing"
      subtitle="See your REOVANA plan and manage or cancel your Stripe subscription."
    >
      <BillingPanel />
    </MemberDashboardShell>
  );
}
