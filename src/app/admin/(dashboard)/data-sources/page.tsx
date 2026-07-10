import DataSources from "@/views/admin/data-sources";
import { fetchScrapeAnalytics } from "@/lib/admin/listing-analytics";

export const dynamic = "force-dynamic";

export default async function DataSourcesPage() {
  const analytics = await fetchScrapeAnalytics();
  return <DataSources analytics={analytics} />;
}
