import Link from "next/link";
import type { ReactNode } from "react";

type ListingDetailLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
};

export function isExternalListingUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function ListingDetailLink({ href, className, children, ariaLabel }: ListingDetailLinkProps) {
  if (!href || href === "#") {
    return <span className={className}>{children}</span>;
  }

  if (isExternalListingUrl(href)) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
