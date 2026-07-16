"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { updateLoanLeadAction } from "@/app/admin/loan-leads-actions";
import { formatMoney } from "@/lib/loan-calculator-math";
import {
  LOAN_LEAD_STATUSES,
  LOAN_PURPOSE_OPTIONS,
  type LoanLeadStatus,
} from "@/lib/loans/loan-types";
import type { LoanLeadRow } from "@/lib/loans/loan-leads";
import { Download, Mail, Phone, Search, User } from "lucide-react";

type Props = {
  available: boolean;
  leads: LoanLeadRow[];
  statusFilter: string;
  q: string;
};

function purposeLabel(id: string): string {
  return LOAN_PURPOSE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function formatDate(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ts));
}

export default function LoanLeadsAdmin({ available, leads, statusFilter, q }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [queryDraft, setQueryDraft] = useState(q);
  const [selectedId, setSelectedId] = useState(leads[0]?.id ?? "");
  const [assignedDraft, setAssignedDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? leads[0],
    [leads, selectedId],
  );

  const navigate = (next: { status?: string; q?: string }) => {
    const params = new URLSearchParams();
    const status = next.status ?? statusFilter;
    const query = next.q ?? q;
    if (status && status !== "all") params.set("status", status);
    if (query.trim()) params.set("q", query.trim());
    const href = params.toString()
      ? `/admin/loan-leads?${params.toString()}`
      : "/admin/loan-leads";
    startTransition(() => router.push(href));
  };

  const onStatusChange = (status: LoanLeadStatus) => {
    if (!selected) return;
    setMessage(null);
    startTransition(async () => {
      const result = await updateLoanLeadAction({ id: selected.id, status });
      if ("error" in result) setMessage(result.error);
      else {
        setMessage("Status updated.");
        router.refresh();
      }
    });
  };

  const onAssign = () => {
    if (!selected) return;
    setMessage(null);
    startTransition(async () => {
      const result = await updateLoanLeadAction({
        id: selected.id,
        assignedTo: assignedDraft || null,
      });
      if ("error" in result) setMessage(result.error);
      else {
        setMessage("Assignee saved.");
        router.refresh();
      }
    });
  };

  const exportCsv = () => {
    const header = [
      "id",
      "created_at",
      "status",
      "assigned_to",
      "full_name",
      "email",
      "phone",
      "purpose",
      "city",
      "state",
      "purchase_price",
      "estimated_loan",
      "estimated_rate",
      "monthly_payment",
    ];
    const rows = leads.map((lead) => {
      const est = lead.estimate;
      return [
        lead.id,
        lead.createdAt,
        lead.status,
        lead.assignedTo ?? "",
        lead.fullName,
        lead.email,
        lead.phone ?? "",
        lead.purpose,
        lead.propertyCity ?? "",
        lead.propertyState ?? "",
        lead.purchasePrice ?? "",
        est.estimatedLoanAmount ?? "",
        est.estimatedRatePercent ?? "",
        est.monthlyPayment ?? "",
      ]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",");
    });
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loan-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Loan Leads</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">
            Find a Loan wizard submissions
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-white/15 text-white"
          onClick={exportCsv}
          disabled={leads.length === 0}
        >
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      {!available ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="Loan leads unavailable"
              description="Could not reach loan_leads. Apply migration 019_loan_leads.sql and check service role env."
            />
          </CardContent>
        </Card>
      ) : leads.length === 0 && !q && statusFilter === "all" ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="No loan leads yet"
              description="When visitors complete Find a Loan on the public site, submissions appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6 flex flex-col gap-3 md:flex-row md:items-center">
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate({ q: queryDraft, status: statusFilter });
                }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                  <Input
                    value={queryDraft}
                    onChange={(e) => setQueryDraft(e.target.value)}
                    placeholder="Search name, email, city…"
                    className="pl-9"
                  />
                </div>
                <Button type="submit" disabled={isPending}>
                  Search
                </Button>
              </form>
              <select
                className="h-9 rounded-md border border-white/15 bg-transparent px-3 text-sm text-white"
                value={statusFilter}
                onChange={(e) => navigate({ status: e.target.value, q: queryDraft })}
              >
                <option value="all">All statuses</option>
                {LOAN_LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-white">
                  {leads.length} lead{leads.length === 1 ? "" : "s"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leads.length === 0 ? (
                  <p className="text-sm text-white/50">No leads match this filter.</p>
                ) : (
                  leads.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(lead.id);
                        setAssignedDraft(lead.assignedTo ?? "");
                        setMessage(null);
                      }}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        selected?.id === lead.id
                          ? "border-white/30 bg-white/10"
                          : "border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-white">
                          {lead.fullName}
                        </p>
                        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-white/70">
                          {lead.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-white/50">
                        {purposeLabel(lead.purpose)} · {lead.propertyCity}, {lead.propertyState}
                      </p>
                      <p className="mt-1 text-xs text-white/40">{formatDate(lead.createdAt)}</p>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-white">Lead detail</CardTitle>
              </CardHeader>
              <CardContent>
                {!selected ? (
                  <p className="text-sm text-white/50">Select a lead.</p>
                ) : (
                  <div className="space-y-4 text-sm text-white/80">
                    <div>
                      <p className="text-lg font-semibold text-white">{selected.fullName}</p>
                      <p className="flex items-center gap-2 text-white/60">
                        <Mail className="size-3.5" /> {selected.email}
                      </p>
                      {selected.phone ? (
                        <p className="flex items-center gap-2 text-white/60">
                          <Phone className="size-3.5" /> {selected.phone}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-white/40">Purpose</span>
                        <p className="text-white">{purposeLabel(selected.purpose)}</p>
                      </div>
                      <div>
                        <span className="text-white/40">Purchase</span>
                        <p className="text-white">
                          {selected.purchasePrice != null
                            ? formatMoney(selected.purchasePrice)
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/40">Location</span>
                        <p className="text-white">
                          {selected.propertyCity}, {selected.propertyState}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/40">Est. loan</span>
                        <p className="text-white">
                          {selected.estimate.estimatedLoanAmount != null
                            ? formatMoney(Number(selected.estimate.estimatedLoanAmount))
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/40">Est. rate</span>
                        <p className="text-white">
                          {selected.estimate.estimatedRatePercent != null
                            ? `${Number(selected.estimate.estimatedRatePercent).toFixed(2)}%`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/40">Monthly</span>
                        <p className="text-white">
                          {selected.estimate.monthlyPayment != null
                            ? formatMoney(Number(selected.estimate.monthlyPayment))
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {selected.notes ? (
                      <div>
                        <span className="text-xs text-white/40">Notes</span>
                        <p className="mt-1 whitespace-pre-wrap text-white/80">{selected.notes}</p>
                      </div>
                    ) : null}

                    <div className="space-y-2 border-t border-white/10 pt-4">
                      <label className="block text-xs text-white/40">Status</label>
                      <select
                        className="h-9 w-full rounded-md border border-white/15 bg-transparent px-3 text-sm text-white"
                        value={selected.status}
                        disabled={isPending}
                        onChange={(e) => onStatusChange(e.target.value as LoanLeadStatus)}
                      >
                        {LOAN_LEAD_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs text-white/40">Assigned to</label>
                      <div className="flex gap-2">
                        <Input
                          value={assignedDraft}
                          onChange={(e) => setAssignedDraft(e.target.value)}
                          placeholder="Name or email"
                        />
                        <Button type="button" onClick={onAssign} disabled={isPending}>
                          <User className="size-4" /> Save
                        </Button>
                      </div>
                    </div>

                    {message ? <p className="text-xs text-[#9eb4f0]">{message}</p> : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
