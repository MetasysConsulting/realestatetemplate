import Link from "next/link";
import type { ReactNode } from "react";

type ListingDetailLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
};

/** All listing navigation stays on REOVANA — internal paths only. */
export function ListingDetailLink({ href, className, children, ariaLabel }: ListingDetailLinkProps) {
  if (!href || href === "#") {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
