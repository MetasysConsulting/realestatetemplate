import type { Metadata } from "next";
import { MemberDashboardShell } from "@/components/member/MemberDashboardShell";
import { MemberSavedSearchesList } from "@/components/member/MemberSavedSearchesList";
import { listMySavedSearches } from "@/lib/member/saved-searches";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Saved Searches — REOVANA",
};

export default async function MySaveSearchPage() {
  const searches = await listMySavedSearches();

  return (
    <MemberDashboardShell
      activeHref="/my-save-search"
      title="Saved searches"
      subtitle="Re-run your map searches with one click. Email alerts coming soon."
    >
      <MemberSavedSearchesList searches={searches} />
    </MemberDashboardShell>
  );
}
