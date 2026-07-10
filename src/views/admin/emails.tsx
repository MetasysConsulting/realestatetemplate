"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Mail, Plus } from "lucide-react";

const Emails = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Email Management</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">
            Campaigns, alerts, and automated member emails
          </p>
        </div>
        <Button className="bg-primary text-white" disabled>
          <Plus className="h-4 w-4" /> New campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEmptyState
            title="No campaigns yet"
            description="Email campaigns and delivery stats will appear here once email tooling is connected."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Emails;
