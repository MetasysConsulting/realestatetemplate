"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { DATA_SOURCE_FEEDS, REOVANA_BRAND } from "@/lib/admin/reovana-admin-data";
import { AlertCircle, CheckCircle2, Database, ExternalLink, Play, RefreshCw } from "lucide-react";

const DataSources = () => {
  const [running, setRunning] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleRun = (name: string, status: string) => {
    if (status === "Blocked") {
      setToast(`${name} is blocked — cannot run until source access is restored.`);
      return;
    }
    setRunning(name);
    setTimeout(() => {
      setRunning(null);
      setToast(`${name} scrape queued (demo — no backend connected).`);
      setTimeout(() => setToast(null), 4000);
    }, 1500);
  };

  const active = DATA_SOURCE_FEEDS.filter((f) => f.status === "Active");
  const blocked = DATA_SOURCE_FEEDS.filter((f) => f.status === "Blocked");
  const totalListings = DATA_SOURCE_FEEDS.reduce((sum, f) => sum + f.listings, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Data Sources</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">
            Scraper feeds that power listing inventory on the public REOVANA site
          </p>
        </div>
        <Button variant="outline" className="border-primary/50" asChild>
          <a href={REOVANA_BRAND.localPublicSiteUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> View public site
          </a>
        </Button>
      </div>

      {toast && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-slate-200">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-white/50 uppercase tracking-wider">Total listings synced</p>
            <p className="text-3xl font-bold text-white mt-1">{totalListings.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-white/50 uppercase tracking-wider">Active feeds</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{active.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-white/50 uppercase tracking-wider">Needs attention</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">{blocked.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Feed registry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DATA_SOURCE_FEEDS.map((feed) => (
            <div
              key={feed.name}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {feed.status === "Active" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-white">{feed.name}</p>
                  <p className="text-sm text-white/50">
                    {feed.listings.toLocaleString()} listings · Last sync: {feed.lastSync}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    feed.status === "Active"
                      ? "border-green-500/30 text-green-400 bg-green-500/10"
                      : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                  }`}
                >
                  {feed.status}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/30"
                  disabled={running === feed.name}
                  onClick={() => handleRun(feed.name, feed.status)}
                >
                  {running === feed.name ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run scrape
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSources;
