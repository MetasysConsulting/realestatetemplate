import Link from "next/link";
import type { MemberNavCounts } from "@/lib/member/nav-counts";

export type MemberNavItem = {
  href: string;
  label: string;
  countKey?: keyof MemberNavCounts;
};

export const MEMBER_NAV_ITEMS: MemberNavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-profile", label: "Profile" },
  { href: "/billing", label: "Billing & plan" },
  { href: "/my-favorites", label: "My favorites", countKey: "favorites" },
  { href: "/my-save-search", label: "Saved searches", countKey: "savedSearches" },
  { href: "/my-property", label: "My properties" },
  { href: "/add-property", label: "Add property" },
];

type MemberSidebarProps = {
  activeHref: string;
  counts: MemberNavCounts;
};

export function MemberSidebar({ activeHref, counts }: MemberSidebarProps) {
  return (
    <aside className="reovana-member-sidebar" aria-label="Member dashboard">
      <p className="reovana-member-sidebar__eyebrow">Member area</p>
      <nav className="reovana-member-sidebar__nav">
        <ul>
          {MEMBER_NAV_ITEMS.map((item) => {
            const isActive =
              activeHref === item.href ||
              (item.href !== "/dashboard" && activeHref.startsWith(`${item.href}`));
            const count =
              item.countKey && counts[item.countKey] > 0
                ? counts[item.countKey]
                : null;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`reovana-member-sidebar__link${isActive ? " is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{item.label}</span>
                  {count != null ? (
                    <span className="reovana-member-sidebar__badge">{count}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="reovana-member-sidebar__foot">
        <Link href="/search" className="reovana-member-sidebar__foot-link">
          Map search
        </Link>
      </div>
    </aside>
  );
}
