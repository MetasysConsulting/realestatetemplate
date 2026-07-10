"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Home, Search } from "lucide-react";

const Listings = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Listings</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">
          Manage inventory across REOVANA buy categories
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, city, or state..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Listings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEmptyState
            title="No listings to display"
            description="Admin listing management will appear here once this view is connected to live inventory."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Listings;
