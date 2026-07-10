"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import Link from "next/link";
import { MessageSquare, FileText, Building2, TrendingUp, Clock, RefreshCw } from "lucide-react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">REOVANA Dashboard</h1>
          <p className="text-white/50 mt-1 text-sm sm:text-base">
            Listings, unlocks, and data feeds across the distressed property marketplace.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="border-primary/50 text-slate-200 hover:bg-primary/10 hover:border-primary flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Last 7 days</span>
            <span className="sm:hidden">7 days</span>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-white text-base sm:text-lg">Overview metrics</CardTitle>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Key performance indicators for listings and revenue
          </p>
        </CardHeader>
        <CardContent>
          <AdminEmptyState
            title="No metrics available yet"
            description="Dashboard metrics will appear here once analytics and billing data are connected."
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white text-base sm:text-lg">Listing & revenue trends</CardTitle>
            <p className="text-xs sm:text-sm text-white/50 mt-1">Monthly listings, unlocks, and unlock revenue</p>
          </CardHeader>
          <CardContent>
            <AdminEmptyState
              compact
              title="No trend data yet"
              description="Charts will populate when live reporting is enabled."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-white text-base sm:text-lg">Recent activity</CardTitle>
            <p className="text-xs sm:text-sm text-white/50 mt-1">Latest system events</p>
          </CardHeader>
          <CardContent>
            <AdminEmptyState
              compact
              title="No recent activity"
              description="Scraper runs, unlocks, and admin actions will show up here."
            />
          </CardContent>
        </Card>
      </div>

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
                <span className="text-xs sm:text-sm">Run Scrapers</span>
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
};

export default Dashboard;
