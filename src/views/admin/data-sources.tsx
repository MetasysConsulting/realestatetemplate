"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { REOVANA_BRAND } from "@/lib/admin/reovana-admin-data";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Database, ExternalLink } from "lucide-react";

const DataSources = () => {
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

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Feed registry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEmptyState
            title="No feed analytics yet"
            description="Scraper status, sync history, and listing counts will appear here once feed monitoring is connected."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSources;
