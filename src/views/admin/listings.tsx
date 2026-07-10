"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  formatAdminListingsCount,
  type AdminListingsData,
} from "@/lib/admin/admin-listings-types";
import { Database, ExternalLink, Home, Search } from "lucide-react";

type ListingsProps = {
  data: AdminListingsData;
};

export default function Listings({ data }: ListingsProps) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.listings.filter((row) => {
      if (sourceFilter !== "all" && row.sourceId !== sourceFilter) return false;
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        row.id.toLowerCase().includes(q) ||
        row.address.toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q) ||
        row.state.toLowerCase().includes(q) ||
        row.zip.toLowerCase().includes(q) ||
        row.sourceName.toLowerCase().includes(q) ||
        row.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [data.listings, query, sourceFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Listings</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">
          Live inventory from the REOVANA listings database
        </p>
      </div>

      {!data.available ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="Listings unavailable"
              description="Could not reach the listings database. Check Supabase env vars on this deployment."
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
                  {formatAdminListingsCount(data.totalActive)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Sources</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatAdminListingsCount(data.bySource.length)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Categories</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatAdminListingsCount(data.byCategory.length)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  By source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.bySource.length === 0 ? (
                  <p className="text-sm text-white/45">No source counts yet.</p>
                ) : (
                  data.bySource.map((row) => (
                    <div
                      key={row.sourceId}
                      className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-white/5 last:border-0"
                    >
                      <p className="text-white">{row.name}</p>
                      <p className="text-white/80 font-medium">
                        {formatAdminListingsCount(row.count)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-white text-base">By category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.byCategory.length === 0 ? (
                  <p className="text-sm text-white/45">No category counts yet.</p>
                ) : (
                  data.byCategory.map((row) => (
                    <div
                      key={row.category}
                      className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-white/5 last:border-0"
                    >
                      <p className="text-white">{row.label}</p>
                      <p className="text-white/80 font-medium">
                        {formatAdminListingsCount(row.count)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, address, city, state..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={sourceFilter === "all" ? "default" : "outline"}
                  onClick={() => setSourceFilter("all")}
                >
                  All sources
                </Button>
                {data.bySource.map((source) => (
                  <Button
                    key={source.sourceId}
                    size="sm"
                    variant={sourceFilter === source.sourceId ? "default" : "outline"}
                    onClick={() => setSourceFilter(source.sourceId)}
                  >
                    {source.name}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={categoryFilter === "all" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("all")}
                >
                  All categories
                </Button>
                {data.byCategory.slice(0, 8).map((category) => (
                  <Button
                    key={category.category}
                    size="sm"
                    variant={categoryFilter === category.category ? "default" : "outline"}
                    onClick={() => setCategoryFilter(category.category)}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Recent listings
              </CardTitle>
              <p className="text-sm text-white/45">
                Showing {formatAdminListingsCount(filtered.length)} of{" "}
                {formatAdminListingsCount(data.listings.length)} loaded
                {data.totalActive > data.listings.length
                  ? ` · ${formatAdminListingsCount(data.totalActive)} total active`
                  : ""}
              </p>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <AdminEmptyState
                  compact
                  title="No matching listings"
                  description="Try a different search or clear the source/category filters."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-white/50 border-b border-white/10">
                        <th className="pb-3 pr-4 font-medium">Location</th>
                        <th className="pb-3 pr-4 font-medium">Source</th>
                        <th className="pb-3 pr-4 font-medium">Category</th>
                        <th className="pb-3 pr-4 font-medium text-right">Price</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => (
                        <tr key={row.id} className="border-b border-white/5 align-top">
                          <td className="py-3 pr-4">
                            <p className="text-white font-medium">
                              {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                            </p>
                            <p className="text-xs text-white/45 mt-0.5 max-w-[280px] truncate">
                              {row.address}
                            </p>
                            <p className="text-[11px] text-white/30 font-mono mt-0.5">{row.id}</p>
                          </td>
                          <td className="py-3 pr-4 text-white/80">{row.sourceName}</td>
                          <td className="py-3 pr-4 text-white/80">{row.categoryLabel}</td>
                          <td className="py-3 pr-4 text-right text-white font-semibold">
                            {row.priceLabel}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-xs px-2 py-0.5 rounded-full border border-green-500/30 text-green-400 bg-green-500/10">
                                Active
                              </span>
                              {row.detailUrl ? (
                                <a
                                  href={row.detailUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  Source <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : null}
                            </div>
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
