import type { Metadata } from "next";
import { MemberDashboardShell } from "@/components/member/MemberDashboardShell";
import { AddPropertyForm } from "@/components/sell/AddPropertyForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Add Property — REOVANA",
};

export default function AddPropertyPage() {
  return (
    <MemberDashboardShell
      activeHref="/add-property"
      title="Add property"
      subtitle="Sell On Your Own — save your listing draft, then subscribe for $49/month to publish."
    >
      <AddPropertyForm />
    </MemberDashboardShell>
  );
}
