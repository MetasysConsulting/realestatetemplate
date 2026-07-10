"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { TrendingUp, Download, Calendar } from "lucide-react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

const Analytics = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">REOVANA Analytics</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">
            Traffic, unlock revenue, subscriptions, and data feed health
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-primary/50 text-slate-200 hover:bg-primary/10 hover:border-primary">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Last 7 days</span>
          </Button>
          <Button
            className="bg-linear-to-r from-primary to-sidebar-primary hover:from-sidebar-primary hover:to-primary text-white border-0"
            disabled
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Data</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Analytics overview
          </CardTitle>
          <p className="text-sm text-white/50 mt-1">
            Reports and charts for revenue, traffic, and scraper performance
          </p>
        </CardHeader>
        <CardContent>
          <AdminEmptyState
            title="No analytics data yet"
            description="Once reporting is connected, key metrics, revenue trends, and feed health will appear here."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
