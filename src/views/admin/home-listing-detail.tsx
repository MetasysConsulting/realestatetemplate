"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

const ListingDetail = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="outline" className="border-primary/30" asChild>
        <Link href="/admin/home">← Back to Home</Link>
      </Button>
      <Card>
        <CardContent className="pt-6">
          <AdminEmptyState
            title="Listing unavailable"
            description="Listing details will appear here once this view is connected to live inventory."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ListingDetail;
