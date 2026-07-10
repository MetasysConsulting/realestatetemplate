import Analytics from "@/views/admin/analytics";
import { fetchScrapeAnalytics } from "@/lib/admin/listing-analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const analytics = await fetchScrapeAnalytics();
  return <Analytics analytics={analytics} />;
}
