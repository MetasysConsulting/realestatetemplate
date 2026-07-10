"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

const AdminHome = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Home</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">
          Daily overview of listings, members, and revenue
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white text-base sm:text-lg">Today&apos;s snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEmptyState
            title="No data yet"
            description="Home overview metrics will appear here once live reporting is connected to the admin dashboard."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
