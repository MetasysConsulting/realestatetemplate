"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEARN_SUBNAV } from "@/lib/learn-content";

function isActive(pathname: string, href: string): boolean {
  if (href === "/learn") return pathname === "/learn";
  if (href === "/learn/guides/beginners-guide") {
    return pathname.startsWith("/learn/guides");
  }
  if (href === "/learn/help-center") {
    return pathname.startsWith("/learn/help");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LearnSubnav() {
  const pathname = usePathname();

  return (
    <nav className="learn-subnav" aria-label="Learn section">
      <div className="tf-container learn-subnav__inner">
        {LEARN_SUBNAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(pathname, item.href) ? "on" : undefined}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
