"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/client-track";

/**
 * Invisible page-view tracker for the public site.
 * Renders nothing — no visual frontend changes.
 */
export function SiteAnalyticsBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const search = searchParams?.toString();
    const path = search ? `${pathname}?${search}` : pathname;
    if (!path || lastKey.current === path) return;
    lastKey.current = path;
    trackClientEvent("page_view", { path });
  }, [pathname, searchParams]);

  return null;
}
