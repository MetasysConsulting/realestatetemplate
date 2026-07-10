"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Search } from "lucide-react";

const Members = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Manage Members</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">
          View saved properties, posted listings, and payment history
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white text-base">Members</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEmptyState
            title="No members yet"
            description="Member profiles will appear here once user accounts are connected to the admin dashboard."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;
