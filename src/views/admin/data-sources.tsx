import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { REOVANA_BRAND } from "@/lib/admin/reovana-admin-data";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  formatCategoryLabel,
  formatCount,
  formatRelativeTime,
  type ScrapeAnalytics,
} from "@/lib/admin/listing-analytics";
import { AlertCircle, CheckCircle2, Database, ExternalLink, ImageIcon } from "lucide-react";

type DataSourcesProps = {
  analytics: ScrapeAnalytics;
};

export default function DataSources({ analytics }: DataSourcesProps) {
  const { available, sources, categories, totals } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Data Sources</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">
            Live inventory counts by scrape feed from the REOVANA listings database
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                <p className="text-xs text-white/50 uppercase tracking-wider">Feeds with inventory</p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  {formatCount(totals.sourcesWithListings)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Inactive / archived</p>
                <p className="text-3xl font-bold text-white/80 mt-1">
                  {formatCount(totals.inactiveListings)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Needs attention</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">
                  {formatCount(totals.staleSources)}
                </p>
                <p className="text-xs text-white/40 mt-1">Empty or not synced in 14+ days</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Feed registry
              </CardTitle>
              <p className="text-sm text-white/50">
                Counts are live from Supabase — active rows currently shown on the public site
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {sources.length === 0 ? (
                <AdminEmptyState
                  compact
                  title="No sources registered"
                  description="listing_sources is empty. Run migrations and seed scrapers to populate feeds."
                />
              ) : (
                sources.map((feed) => {
                  const imagePct =
                    feed.activeListings > 0
                      ? Math.round((feed.withImage / feed.activeListings) * 100)
                      : 0;
                  const healthy = feed.activeListings > 0 && !feed.isStale;

                  return (
                    <div
                      key={feed.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {healthy ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-white">{feed.name}</p>
                          <p className="text-xs text-white/40 font-mono mt-0.5">{feed.id}</p>
                          <p className="text-sm text-white/50 mt-1">
                            {formatCount(feed.activeListings)} active
                            {feed.inactiveListings > 0
                              ? ` · ${formatCount(feed.inactiveListings)} inactive`
                              : ""}
                            {" · "}
                            Last sync: {formatRelativeTime(feed.lastScrapedAt)}
                          </p>
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
                      </div>
                      <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${
                            healthy
                              ? "border-green-500/30 text-green-400 bg-green-500/10"
                              : feed.activeListings === 0
                                ? "border-white/20 text-white/50 bg-white/5"
                                : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                          }`}
                        >
                          {feed.activeListings === 0
                            ? "No listings yet"
                            : feed.isStale
                              ? "Sync overdue"
                              : "Active"}
                        </span>
                        {feed.activeListings > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-white/50 px-2 py-1 rounded-full border border-white/10">
                            <ImageIcon className="h-3 w-3" />
                            {imagePct}% with image
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-white text-base sm:text-lg">
                Active listings by category
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
                        <th className="pb-3 font-medium text-right">Active listings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((row) => (
                        <tr
                          key={`${row.sourceId}-${row.category}`}
                          className="border-b border-white/5"
                        >
                          <td className="py-3 pr-4 text-white/80 font-mono text-xs">
                            {row.sourceId}
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
