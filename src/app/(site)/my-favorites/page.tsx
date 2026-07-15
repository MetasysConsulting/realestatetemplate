import type { Metadata } from "next";
import { MemberDashboardShell } from "@/components/member/MemberDashboardShell";
import { MemberFavoritesList } from "@/components/member/MemberFavoritesList";
import { listMyFavorites } from "@/lib/member/favorites";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "My Favorites — REOVANA",
};

export default async function MyFavoritesPage() {
  const favorites = await listMyFavorites();

  return (
    <MemberDashboardShell
      activeHref="/my-favorites"
      title="My favorites"
      subtitle="Listings you saved from map search and browse pages."
    >
      <MemberFavoritesList favorites={favorites} />
    </MemberDashboardShell>
  );
}
