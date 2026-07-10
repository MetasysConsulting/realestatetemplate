import Dashboard from "@/views/admin/dashboard";
import { fetchScrapeAnalytics } from "@/lib/admin/listing-analytics";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const analytics = await fetchScrapeAnalytics();
  return <Dashboard analytics={analytics} />;
}
