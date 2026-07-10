"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { BUY_MENU_CATEGORIES, MOCK_LISTINGS } from "@/lib/admin/reovana-admin-data";
import { Eye, Filter, Home, Search, Unlock } from "lucide-react";

const Listings = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    return MOCK_LISTINGS.filter((row) => {
      const matchesQuery =
        !query ||
        row.id.toLowerCase().includes(query.toLowerCase()) ||
        row.city.toLowerCase().includes(query.toLowerCase()) ||
        row.state.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        category === "all" ||
        row.category.toLowerCase().includes(category.toLowerCase().replace(" property", ""));
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Listings</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">
          Mock inventory across REOVANA buy categories — mirrors public site structure
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, city, or state..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={category === "all" ? "default" : "outline"}
                onClick={() => setCategory("all")}
              >
                All
              </Button>
              {BUY_MENU_CATEGORIES.slice(0, 5).map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={category === cat ? "default" : "outline"}
                  className="hidden sm:inline-flex"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
              <Button size="sm" variant="outline" className="sm:hidden">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            {filtered.length} listings
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50 border-b border-white/10">
                <th className="pb-3 pr-4 font-medium">ID</th>
                <th className="pb-3 pr-4 font-medium">Category</th>
                <th className="pb-3 pr-4 font-medium">Location</th>
                <th className="pb-3 pr-4 font-medium">Price</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium text-right">
                  <Eye className="inline h-3.5 w-3.5" />
                </th>
                <th className="pb-3 font-medium text-right">
                  <Unlock className="inline h-3.5 w-3.5" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4 font-mono text-xs text-primary">{row.id}</td>
                  <td className="py-3 pr-4 text-slate-200">{row.category}</td>
                  <td className="py-3 pr-4 text-slate-300">
                    {row.city}, {row.state}
                  </td>
                  <td className="py-3 pr-4 text-white font-medium">{row.price}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        row.status === "Published"
                          ? "border-green-500/30 text-green-400"
                          : row.status === "Draft"
                            ? "border-white/20 text-white/50"
                            : "border-amber-500/30 text-amber-400"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-white/70">{row.views}</td>
                  <td className="py-3 text-right text-white/70">{row.unlocks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Listings;
