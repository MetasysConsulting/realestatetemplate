import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { REOVANA_BRAND } from "@/lib/admin/reovana-admin-data";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  formatCategoryLabel,
  formatCount,
  type ScrapeAnalytics,
} from "@/lib/admin/listing-analytics";
import { Database, ExternalLink } from "lucide-react";

type DataSourcesProps = {
  analytics: ScrapeAnalytics;
};

export default function DataSources({ analytics }: DataSourcesProps) {
  const { available, sources, categories, totals } = analytics;
  const feedsWithData = sources.filter((s) => s.activeListings > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Data Sources</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">
            Where listing inventory comes from in the REOVANA database
          </p>
        </div>
        <Button variant="outline" className="border-primary/50" asChild>
          <a href={REOVANA_BRAND.localPublicSiteUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> View public site
          </a>
        </Button>
      </div>

      {!available ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="Database unavailable"
              description="Could not reach listing_sources / listings. Check Supabase env vars on this deployment."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Active listings</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCount(totals.activeListings)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Data sources</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCount(feedsWithData.length)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">With photos</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCount(totals.withImage)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Sources
              </CardTitle>
              <p className="text-sm text-white/50">
                Active listing counts by scrape feed
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {feedsWithData.length === 0 ? (
                <AdminEmptyState
                  compact
                  title="No listings yet"
                  description="Listing counts will appear here once inventory is in the database."
                />
              ) : (
                feedsWithData.map((feed) => (
                  <div
                    key={feed.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white">{feed.name}</p>
                      {feed.sourceUrl ? (
                        <a
                          href={feed.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          Source site <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                    <p className="text-lg font-semibold text-white sm:text-right shrink-0">
                      {formatCount(feed.activeListings)}
                      <span className="text-sm font-normal text-white/45 ml-2">listings</span>
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-white text-base sm:text-lg">
                Listings by category
              </CardTitle>
              <p className="text-sm text-white/50">
                How inventory maps to public buy / auction categories
              </p>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <AdminEmptyState
                  compact
                  title="No category breakdown yet"
                  description="Category counts will appear once active listings exist in the database."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-white/50 border-b border-white/10">
                        <th className="pb-3 pr-4 font-medium">Source</th>
                        <th className="pb-3 pr-4 font-medium">Category</th>
                        <th className="pb-3 font-medium text-right">Listings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((row) => (
                        <tr
                          key={`${row.sourceId}-${row.category}`}
                          className="border-b border-white/5"
                        >
                          <td className="py-3 pr-4 text-white/80">
                            {sources.find((s) => s.id === row.sourceId)?.name ?? row.sourceId}
                          </td>
                          <td className="py-3 pr-4 text-white">
                            {formatCategoryLabel(row.category)}
                          </td>
                          <td className="py-3 text-right text-white font-semibold">
                            {formatCount(row.count)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
