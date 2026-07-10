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
  Eye,
  Users,
} from "lucide-react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { formatCount, type ScrapeAnalytics } from "@/lib/admin/listing-analytics";
import type { SiteActivitySummary } from "@/lib/admin/site-activity-analytics";

type DashboardProps = {
  analytics: ScrapeAnalytics;
  activity: SiteActivitySummary;
};

export default function Dashboard({ analytics, activity }: DashboardProps) {
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

      {activity.available ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-white/50 mb-2">
                <Users className="h-4 w-4" />
                <p className="text-xs uppercase tracking-wider">Visitors today</p>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCount(activity.visitorsToday)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-white/50 mb-2">
                <Eye className="h-4 w-4" />
                <p className="text-xs uppercase tracking-wider">Page views today</p>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCount(activity.pageViewsToday)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50 mb-2">
                  Site activity
                </p>
                <p className="text-sm text-white/70">
                  {formatCount(activity.pageViews7d)} views · 7 days
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-primary/40" asChild>
                <Link href="/admin/home">Open</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {!available ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="No scrape metrics available"
              description="Could not reach the listings database. Check Supabase env vars on this deployment."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {formatCount(topSources.length)}
                </p>
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-white text-base sm:text-lg">Inventory by source</CardTitle>
                <p className="text-xs sm:text-sm text-white/50 mt-1">
                  Where active listings come from
                </p>
              </CardHeader>
              <CardContent>
                {topSources.length === 0 ? (
                  <AdminEmptyState
                    compact
                    title="No listings yet"
                    description="Listing counts will appear here once inventory is in the database."
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
                            <p className="text-sm font-medium text-white">{source.name}</p>
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
