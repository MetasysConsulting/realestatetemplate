import type { Metadata } from "next";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/member/MemberDashboardShell";
import { listMyFavorites } from "@/lib/member/favorites";
import { getMemberNavCounts } from "@/lib/member/nav-counts";
import { getMyStripeMembership } from "@/lib/unlocks/membership";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Dashboard — REOVANA",
};

export default async function MemberDashboardPage() {
  const [counts, favorites, membership] = await Promise.all([
    getMemberNavCounts(),
    listMyFavorites(),
    getMyStripeMembership(),
  ]);

  const planLabel =
    membership?.status === "active" || membership?.status === "trialing"
      ? "Unlimited plan"
      : "Pay per listing";

  return (
    <MemberDashboardShell
      activeHref="/dashboard"
      title="Dashboard"
      subtitle="Your REOVANA account at a glance."
    >
      <div className="reovana-member-stats">
        <Link href="/my-favorites" className="reovana-member-stat">
          <span className="reovana-member-stat__value">{counts.favorites}</span>
          <span className="reovana-member-stat__label">Favorites</span>
        </Link>
        <Link href="/my-save-search" className="reovana-member-stat">
          <span className="reovana-member-stat__value">{counts.savedSearches}</span>
          <span className="reovana-member-stat__label">Saved searches</span>
        </Link>
        <Link href="/my-profile#my-unlocks" className="reovana-member-stat">
          <span className="reovana-member-stat__value">{counts.unlocks}</span>
          <span className="reovana-member-stat__label">Unlocked listings</span>
        </Link>
        <Link href="/billing" className="reovana-member-stat">
          <span className="reovana-member-stat__value reovana-member-stat__value--text">
            {planLabel}
          </span>
          <span className="reovana-member-stat__label">Billing</span>
        </Link>
      </div>

      <section className="reovana-member-panel">
        <div className="reovana-member-panel__head">
          <h2>Recent favorites</h2>
          <Link href="/my-favorites">View all</Link>
        </div>
        {favorites.length === 0 ? (
          <p className="reovana-member-panel__empty">
            Save listings from map search with the heart icon.{" "}
            <Link href="/search">Start searching</Link>
          </p>
        ) : (
          <ul className="reovana-member-preview">
            {favorites.slice(0, 4).map((row) => (
              <li key={row.listingId}>
                <Link href={row.detailPath}>{row.label}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="reovana-member-panel">
        <div className="reovana-member-panel__head">
          <h2>Quick links</h2>
        </div>
        <div className="reovana-member-quick">
          <Link href="/search" className="tf-btn bg-color-primary pd-20">
            Map search
          </Link>
          <Link href="/add-property" className="tf-btn style-border pd-20">
            Add property
          </Link>
          <Link href="/my-profile" className="tf-btn style-border pd-20">
            Account settings
          </Link>
        </div>
      </section>
    </MemberDashboardShell>
  );
}
