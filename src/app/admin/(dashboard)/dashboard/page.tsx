import Dashboard from "@/views/admin/dashboard";
import { fetchScrapeAnalytics } from "@/lib/admin/listing-analytics";
import { fetchSiteActivitySummary } from "@/lib/admin/site-activity-analytics";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [analytics, activity] = await Promise.all([
    fetchScrapeAnalytics(),
    fetchSiteActivitySummary(),
  ]);
  return <Dashboard analytics={analytics} activity={activity} />;
}
