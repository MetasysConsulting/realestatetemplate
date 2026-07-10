"use client";

import { Suspense } from "react";
import { SiteAnalyticsBeacon } from "@/components/analytics/SiteAnalyticsBeacon";

/** Suspense boundary required for useSearchParams in the App Router. */
export function SiteAnalytics() {
  return (
    <Suspense fallback={null}>
      <SiteAnalyticsBeacon />
    </Suspense>
  );
}
