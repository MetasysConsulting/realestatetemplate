import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import Link from "next/link";
import { Database, Download } from "lucide-react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  formatCategoryLabel,
  formatCount,
  formatRelativeTime,
  type ScrapeAnalytics,
} from "@/lib/admin/listing-analytics";

type AnalyticsProps = {
  analytics: ScrapeAnalytics;
};

export default function Analytics({ analytics }: AnalyticsProps) {
  const { available, sources, categories, totals } = analytics;
  const imageCoverage =
    totals.activeListings > 0
      ? Math.round((totals.withImage / totals.activeListings) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">REOVANA Analytics</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">
            Scrape inventory analytics from the live listings database
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-primary/50 text-slate-200" asChild>
            <Link href="/admin/data-sources">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data sources</span>
            </Link>
          </Button>
          <Button
            className="bg-linear-to-r from-primary to-sidebar-primary text-white border-0"
            disabled
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Data</span>
          </Button>
        </div>
      </div>

      {!available ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="No analytics data yet"
              description="Could not reach the listings database. Check Supabase env vars on this deployment."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Active inventory</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCount(totals.activeListings)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Inactive rows</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCount(totals.inactiveListings)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Image coverage</p>
                <p className="text-3xl font-bold text-white mt-1">{imageCoverage}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Feeds tracked</p>
                <p className="text-3xl font-bold text-white mt-1">{formatCount(sources.length)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-white">Inventory by scrape source</CardTitle>
              <p className="text-sm text-white/50 mt-1">
                Active vs inactive listings and last successful sync timestamp
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-white/50 border-b border-white/10">
                    <th className="pb-3 pr-4 font-medium">Source</th>
                    <th className="pb-3 pr-4 font-medium text-right">Active</th>
                    <th className="pb-3 pr-4 font-medium text-right">Inactive</th>
                    <th className="pb-3 pr-4 font-medium text-right">With image</th>
                    <th className="pb-3 font-medium">Last sync</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.id} className="border-b border-white/5">
                      <td className="py-3 pr-4">
                        <p className="text-white font-medium">{source.name}</p>
                        <p className="text-xs text-white/40 font-mono">{source.id}</p>
                      </td>
                      <td className="py-3 pr-4 text-right text-white font-semibold">
                        {formatCount(source.activeListings)}
                      </td>
                      <td className="py-3 pr-4 text-right text-white/60">
                        {formatCount(source.inactiveListings)}
                      </td>
                      <td className="py-3 pr-4 text-right text-white/80">
                        {formatCount(source.withImage)}
                      </td>
                      <td className="py-3 text-white/60">
                        {formatRelativeTime(source.lastScrapedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-white">Category distribution</CardTitle>
              <p className="text-sm text-white/50 mt-1">Active listings grouped by public category</p>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <AdminEmptyState
                  compact
                  title="No category data yet"
                  description="Category breakdowns will appear when active listings exist."
                />
              ) : (
                <div className="space-y-3">
                  {categories.map((row) => {
                    const pct =
                      totals.activeListings > 0
                        ? Math.round((row.count / totals.activeListings) * 100)
                        : 0;
                    return (
                      <div key={`${row.sourceId}-${row.category}`} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <p className="text-white">
                            {formatCategoryLabel(row.category)}
                            <span className="text-white/40 font-mono text-xs ml-2">
                              {row.sourceId}
                            </span>
                          </p>
                          <p className="text-white/80 font-medium">
                            {formatCount(row.count)}
                            <span className="text-white/40 ml-2">{pct}%</span>
                          </p>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${Math.max(pct, 1)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-white">Revenue & traffic</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminEmptyState
                compact
                title="No billing or traffic data yet"
                description="Unlock revenue and site traffic will appear here once those reporting sources are connected."
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
