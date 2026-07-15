import type { Metadata } from "next";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/member/MemberDashboardShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "My Properties — REOVANA",
};

export default function MyPropertyPage() {
  return (
    <MemberDashboardShell
      activeHref="/my-property"
      title="My properties"
      subtitle="Seller listings you publish on REOVANA will appear here."
    >
      <div className="reovana-member-empty">
        <p>You have not listed a property yet.</p>
        <p className="reovana-member-empty__hint">
          Use Add Property to submit a listing. Seller subscriptions and listing management are
          part of the upcoming Sell page work.
        </p>
        <Link href="/add-property" className="tf-btn bg-color-primary pd-20">
          Add property
        </Link>
      </div>
    </MemberDashboardShell>
  );
}
