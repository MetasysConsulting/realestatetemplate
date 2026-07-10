import ContentTools from "@/views/admin/content-tools";
import { fetchScrapeAnalytics } from "@/lib/admin/listing-analytics";

export const dynamic = "force-dynamic";

export default async function ContentToolsPage() {
  const analytics = await fetchScrapeAnalytics();
  const categories = new Set(analytics.categories.map((c) => c.category));

  return (
    <ContentTools
      stats={{
        activeListings: analytics.totals.activeListings,
        sourcesWithListings: analytics.totals.sourcesWithListings,
        categories: categories.size,
        tools: 20,
      }}
    />
  );
}
