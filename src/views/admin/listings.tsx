"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  buildAdminListingsHref,
  formatAdminListingsCount,
  formatAdminListingsDate,
  type AdminListingsData,
} from "@/lib/admin/admin-listings-types";
import { ChevronLeft, ChevronRight, Database, ExternalLink, Home, Search } from "lucide-react";

type ListingsProps = {
  data: AdminListingsData;
};

export default function Listings({ data }: ListingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [queryDraft, setQueryDraft] = useState(data.query.q);

  useEffect(() => {
    setQueryDraft(data.query.q);
  }, [data.query.q]);

  const navigate = (overrides: Parameters<typeof buildAdminListingsHref>[0]) => {
    const href = buildAdminListingsHref(overrides, data.query);
    startTransition(() => {
      router.push(href);
    });
  };

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate({ q: queryDraft.trim(), page: 1 });
  };

  const rangeStart =
    data.filteredTotal === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const rangeEnd = Math.min(data.page * data.pageSize, data.filteredTotal);

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
                <p className="text-xs text-white/50 uppercase tracking-wider">Inactive</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatAdminListingsCount(data.totalInactive)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-white/50 uppercase tracking-wider">Matching filters</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatAdminListingsCount(data.filteredTotal)}
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
                    <button
                      key={row.sourceId}
                      type="button"
                      onClick={() =>
                        navigate({
                          sourceId: data.query.sourceId === row.sourceId ? "all" : row.sourceId,
                          page: 1,
                        })
                      }
                      className={`w-full flex items-center justify-between gap-3 text-sm py-1.5 border-b border-white/5 last:border-0 text-left transition-colors ${
                        data.query.sourceId === row.sourceId
                          ? "text-primary"
                          : "text-white hover:text-primary"
                      }`}
                    >
                      <span>{row.name}</span>
                      <span className="text-white/80 font-medium">
                        {formatAdminListingsCount(row.count)}
                      </span>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-white text-base">By category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {data.byCategory.length === 0 ? (
                  <p className="text-sm text-white/45">No category counts yet.</p>
                ) : (
                  data.byCategory.map((row) => (
                    <button
                      key={row.category}
                      type="button"
                      onClick={() =>
                        navigate({
                          category: data.query.category === row.category ? "all" : row.category,
                          page: 1,
                        })
                      }
                      className={`w-full flex items-center justify-between gap-3 text-sm py-1.5 border-b border-white/5 last:border-0 text-left transition-colors ${
                        data.query.category === row.category
                          ? "text-primary"
                          : "text-white hover:text-primary"
                      }`}
                    >
                      <span>{row.label}</span>
                      <span className="text-white/80 font-medium">
                        {formatAdminListingsCount(row.count)}
                      </span>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <form onSubmit={onSearchSubmit} className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ID, address, city, zip, source..."
                  value={queryDraft}
                  onChange={(e) => setQueryDraft(e.target.value)}
                  className="pl-9"
                />
              </form>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "1", label: "Active" },
                    { value: "0", label: "Inactive" },
                    { value: "all", label: "All status" },
                  ] as const
                ).map((item) => (
                  <Button
                    key={item.value}
                    size="sm"
                    variant={data.query.active === item.value ? "default" : "outline"}
                    onClick={() => navigate({ active: item.value, page: 1 })}
                    disabled={isPending}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={data.query.sourceId === "all" ? "default" : "outline"}
                  onClick={() => navigate({ sourceId: "all", page: 1 })}
                  disabled={isPending}
                >
                  All sources
                </Button>
                {data.bySource.map((source) => (
                  <Button
                    key={source.sourceId}
                    size="sm"
                    variant={data.query.sourceId === source.sourceId ? "default" : "outline"}
                    onClick={() => navigate({ sourceId: source.sourceId, page: 1 })}
                    disabled={isPending}
                  >
                    {source.name}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={data.query.category === "all" ? "default" : "outline"}
                  onClick={() => navigate({ category: "all", page: 1 })}
                  disabled={isPending}
                >
                  All categories
                </Button>
                {data.byCategory.slice(0, 10).map((category) => (
                  <Button
                    key={category.category}
                    size="sm"
                    variant={
                      data.query.category === category.category ? "default" : "outline"
                    }
                    onClick={() => navigate({ category: category.category, page: 1 })}
                    disabled={isPending}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={isPending ? "opacity-70 transition-opacity" : undefined}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Inventory
              </CardTitle>
              <p className="text-sm text-white/45">
                {data.filteredTotal === 0
                  ? "No matches"
                  : `Showing ${formatAdminListingsCount(rangeStart)}–${formatAdminListingsCount(rangeEnd)} of ${formatAdminListingsCount(data.filteredTotal)}`}
                {data.totalPages > 1
                  ? ` · Page ${data.page} of ${formatAdminListingsCount(data.totalPages)}`
                  : ""}
              </p>
            </CardHeader>
            <CardContent>
              {data.listings.length === 0 ? (
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
                        <th className="pb-3 pr-4 font-medium">Updated</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.listings.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-white/5 align-top hover:bg-white/[0.03]"
                        >
                          <td className="py-3 pr-4">
                            <Link
                              href={`/admin/listings/${encodeURIComponent(row.id)}`}
                              className="group"
                            >
                              <p className="text-white font-medium group-hover:text-primary transition-colors">
                                {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                              </p>
                              <p className="text-xs text-white/45 mt-0.5 max-w-[280px] truncate">
                                {row.address}
                              </p>
                              <p className="text-[11px] text-white/30 font-mono mt-0.5">
                                {row.id}
                              </p>
                            </Link>
                          </td>
                          <td className="py-3 pr-4 text-white/80">{row.sourceName}</td>
                          <td className="py-3 pr-4 text-white/80">{row.categoryLabel}</td>
                          <td className="py-3 pr-4 text-right text-white font-semibold">
                            {row.priceLabel}
                          </td>
                          <td className="py-3 pr-4 text-white/55 text-xs whitespace-nowrap">
                            {formatAdminListingsDate(row.updatedAt)}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${
                                  row.isActive
                                    ? "border-green-500/30 text-green-400 bg-green-500/10"
                                    : "border-white/20 text-white/50 bg-white/5"
                                }`}
                              >
                                {row.isActive ? "Active" : "Inactive"}
                              </span>
                              <Link
                                href={`/admin/listings/${encodeURIComponent(row.id)}`}
                                className="text-xs text-primary hover:underline"
                              >
                                View detail
                              </Link>
                              {row.detailUrl ? (
                                <a
                                  href={row.detailUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-white/45 hover:text-white/70"
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

              {data.totalPages > 1 ? (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <p className="text-sm text-white/45">
                    Page {data.page} of {formatAdminListingsCount(data.totalPages)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={data.page <= 1 || isPending}
                      onClick={() => navigate({ page: data.page - 1 })}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={data.page >= data.totalPages || isPending}
                      onClick={() => navigate({ page: data.page + 1 })}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
