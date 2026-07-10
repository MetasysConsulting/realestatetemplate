import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import Link from "next/link";
import {
  MessageSquare,
  FileText,
  Building2,
  TrendingUp,
  RefreshCw,
  Database,
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  formatCount,
  formatRelativeTime,
  type ScrapeAnalytics,
} from "@/lib/admin/listing-analytics";

type DashboardProps = {
  analytics: ScrapeAnalytics;
};

export default function Dashboard({ analytics }: DashboardProps) {
  const { available, sources, totals } = analytics;
  const imageCoverage =
    totals.activeListings > 0
      ? Math.round((totals.withImage / totals.activeListings) * 100)
      : 0;
  const topSources = sources.filter((s) => s.activeListings > 0).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">REOVANA Dashboard</h1>
          <p className="text-white/50 mt-1 text-sm sm:text-base">
            Live scrape inventory from the listings database
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="border-primary/50 text-slate-200 hover:bg-primary/10 hover:border-primary flex-1 sm:flex-none text-xs sm:text-sm"
            asChild
          >
            <Link href="/admin/data-sources">
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Data sources</span>
              <span className="sm:hidden">Sources</span>
            </Link>
          </Button>
          <Button
            className="bg-linear-to-r from-primary to-sidebar-primary hover:from-sidebar-primary hover:to-primary text-white border-0 flex-1 sm:flex-none text-xs sm:text-sm"
            asChild
          >
            <Link href="/admin/analytics">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">View Reports</span>
              <span className="sm:hidden">Reports</span>
            </Link>
          </Button>
        </div>
      </div>

      {!available ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="No scrape metrics available"
              description="Connect DATABASE_URL to load live listing counts from Supabase."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Active listings</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCount(totals.activeListings)}
                </p>
                <p className="text-xs text-white/40 mt-1">Currently live in the database</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Active feeds</p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  {formatCount(totals.sourcesWithListings)}
                </p>
                <p className="text-xs text-white/40 mt-1">Sources with at least one listing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Image coverage</p>
                <p className="text-3xl font-bold text-white mt-1">{imageCoverage}%</p>
                <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {formatCount(totals.withImage)} with photos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Needs attention</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">
                  {formatCount(totals.staleSources)}
                </p>
                <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Empty or sync overdue
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-white text-base sm:text-lg">Top scrape feeds</CardTitle>
                <p className="text-xs sm:text-sm text-white/50 mt-1">
                  Highest active listing volume by source
                </p>
              </CardHeader>
              <CardContent>
                {topSources.length === 0 ? (
                  <AdminEmptyState
                    compact
                    title="No listings yet"
                    description="Run scrapers and seed the database to populate feed counts."
                  />
                ) : (
                  <div className="space-y-3">
                    {topSources.map((source) => {
                      const share =
                        totals.activeListings > 0
                          ? Math.round((source.activeListings / totals.activeListings) * 100)
                          : 0;
                      return (
                        <div
                          key={source.id}
                          className="p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div>
                              <p className="text-sm font-medium text-white">{source.name}</p>
                              <p className="text-xs text-white/40">
                                Last sync {formatRelativeTime(source.lastScrapedAt)}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-white">
                              {formatCount(source.activeListings)}
                            </p>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${Math.max(share, 2)}%` }}
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
                <CardTitle className="text-white text-base sm:text-lg">Billing & unlocks</CardTitle>
                <p className="text-xs sm:text-sm text-white/50 mt-1">
                  Revenue metrics require Stripe reporting
                </p>
              </CardHeader>
              <CardContent>
                <AdminEmptyState
                  compact
                  title="No billing data yet"
                  description="Unlock and subscription metrics will appear here once Stripe reporting is connected."
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-white text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-1.5 sm:gap-2 py-3 sm:py-4 bg-primary/5 border-primary/30 text-slate-200 hover:bg-primary/10 hover:border-primary hover:text-white transition-all"
              asChild
            >
              <Link href="/admin/data-sources">
                <RefreshCw className="h-4! w-4! sm:h-5! sm:w-5! text-primary" />
                <span className="text-xs sm:text-sm">Data Sources</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-1.5 sm:gap-2 py-3 sm:py-4 bg-primary/5 border-primary/30 text-slate-200 hover:bg-primary/10 hover:border-primary hover:text-white transition-all"
              asChild
            >
              <Link href="/admin/listings">
                <Building2 className="h-4! w-4! sm:h-5! sm:w-5! text-primary" />
                <span className="text-xs sm:text-sm">Manage Listings</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-1.5 sm:gap-2 py-3 sm:py-4 bg-primary/5 border-primary/30 text-slate-200 hover:bg-primary/10 hover:border-primary hover:text-white transition-all"
              asChild
            >
              <Link href="/admin/chatbot">
                <MessageSquare className="h-4! w-4! sm:h-5! sm:w-5! text-primary" />
                <span className="text-xs sm:text-sm">Ask Admin AI</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-1.5 sm:gap-2 py-3 sm:py-4 bg-primary/5 border-primary/30 text-slate-200 hover:bg-primary/10 hover:border-primary hover:text-white transition-all"
              asChild
            >
              <Link href="/admin/analytics">
                <FileText className="h-4! w-4! sm:h-5! sm:w-5! text-primary" />
                <span className="text-xs sm:text-sm">View Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
