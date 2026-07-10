"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { CreditCard } from "lucide-react";

const plannedPricing = [
  { name: "Per unlock", detail: "$4.99 one-time listing unlock (public site)" },
  { name: "Pro", detail: "$49/mo unlimited unlocks (public site)" },
] as const;

const Subscription = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Plans & Billing</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">
          Stripe billing, unlock revenue, and member plans
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AdminEmptyState
            title="Stripe not connected"
            description="Member plans, unlock volume, and revenue will appear here once Stripe checkout and reporting are wired. Admin operators are not billed through this page."
          />

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-sm font-medium text-white">Planned public pricing</p>
            <ul className="space-y-2">
              {plannedPricing.map((item) => (
                <li key={item.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                  <span className="text-slate-200">{item.name}</span>
                  <span className="text-white/50">{item.detail}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full sm:w-auto" disabled>
              Connect Stripe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscription;
