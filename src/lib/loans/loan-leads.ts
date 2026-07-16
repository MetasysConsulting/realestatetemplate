import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseProjectUrl,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";
import type { LoanEstimateResult } from "@/lib/loans/loan-estimate";
import type { LoanLeadStatus } from "@/lib/loans/loan-types";

export type LoanLeadInsert = {
  purpose: string;
  propertyType: string;
  timeline: string;
  purchasePrice: number;
  downPaymentPercent: number;
  rehabBudget: number | null;
  afterRepairValue: number | null;
  expectedMonthlyRent: number | null;
  propertyCity: string;
  propertyState: string;
  creditBand: string;
  experience: string;
  fullName: string;
  email: string;
  phone: string | null;
  notes: string | null;
  estimate: LoanEstimateResult;
  metadata?: Record<string, unknown>;
};

function serviceClient() {
  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function insertLoanLead(
  input: LoanLeadInsert,
): Promise<{ id: string } | { error: string }> {
  const client = serviceClient();
  if (!client) {
    return { error: "Loan lead storage is not configured." };
  }

  const { data, error } = await client
    .from("loan_leads")
    .insert({
      purpose: input.purpose,
      property_type: input.propertyType,
      timeline: input.timeline,
      purchase_price: input.purchasePrice,
      down_payment_percent: input.downPaymentPercent,
      rehab_budget: input.rehabBudget,
      after_repair_value: input.afterRepairValue,
      expected_monthly_rent: input.expectedMonthlyRent,
      property_city: input.propertyCity.slice(0, 120),
      property_state: input.propertyState.slice(0, 2).toUpperCase(),
      credit_band: input.creditBand,
      experience: input.experience,
      full_name: input.fullName.slice(0, 120),
      email: input.email.slice(0, 254).toLowerCase(),
      phone: input.phone?.slice(0, 40) ?? null,
      notes: input.notes?.slice(0, 2000) ?? null,
      estimate: input.estimate,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[loan_leads] insert failed", error?.message);
    return { error: "Could not save your request. Please try again." };
  }

  return { id: String(data.id) };
}

export type LoanLeadRow = {
  id: string;
  status: LoanLeadStatus;
  assignedTo: string | null;
  purpose: string;
  propertyType: string | null;
  timeline: string | null;
  purchasePrice: number | null;
  downPaymentPercent: number | null;
  rehabBudget: number | null;
  afterRepairValue: number | null;
  expectedMonthlyRent: number | null;
  propertyCity: string | null;
  propertyState: string | null;
  creditBand: string | null;
  experience: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  notes: string | null;
  estimate: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

function mapLead(row: Record<string, unknown>): LoanLeadRow {
  return {
    id: String(row.id),
    status: String(row.status ?? "new") as LoanLeadStatus,
    assignedTo: row.assigned_to ? String(row.assigned_to) : null,
    purpose: String(row.purpose ?? ""),
    propertyType: row.property_type ? String(row.property_type) : null,
    timeline: row.timeline ? String(row.timeline) : null,
    purchasePrice: row.purchase_price != null ? Number(row.purchase_price) : null,
    downPaymentPercent:
      row.down_payment_percent != null ? Number(row.down_payment_percent) : null,
    rehabBudget: row.rehab_budget != null ? Number(row.rehab_budget) : null,
    afterRepairValue:
      row.after_repair_value != null ? Number(row.after_repair_value) : null,
    expectedMonthlyRent:
      row.expected_monthly_rent != null ? Number(row.expected_monthly_rent) : null,
    propertyCity: row.property_city ? String(row.property_city) : null,
    propertyState: row.property_state ? String(row.property_state) : null,
    creditBand: row.credit_band ? String(row.credit_band) : null,
    experience: row.experience ? String(row.experience) : null,
    fullName: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    phone: row.phone ? String(row.phone) : null,
    notes: row.notes ? String(row.notes) : null,
    estimate:
      row.estimate && typeof row.estimate === "object" && !Array.isArray(row.estimate)
        ? (row.estimate as Record<string, unknown>)
        : {},
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function listLoanLeads(options?: {
  status?: string;
  q?: string;
  limit?: number;
}): Promise<{ available: boolean; leads: LoanLeadRow[] }> {
  const client = serviceClient();
  if (!client) return { available: false, leads: [] };

  let query = client
    .from("loan_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(200, Math.max(1, options?.limit ?? 100)));

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const q = options?.q?.trim();
  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,property_city.ilike.%${q}%,phone.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[loan_leads] list failed", error.message);
    return { available: false, leads: [] };
  }

  return {
    available: true,
    leads: (data ?? []).map((row) => mapLead(row as Record<string, unknown>)),
  };
}

export async function updateLoanLead(input: {
  id: string;
  status?: LoanLeadStatus;
  assignedTo?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const client = serviceClient();
  if (!client) return { error: "Not configured." };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.status) patch.status = input.status;
  if (input.assignedTo !== undefined) {
    patch.assigned_to = input.assignedTo?.trim() || null;
  }

  const { error } = await client.from("loan_leads").update(patch).eq("id", input.id);
  if (error) {
    console.error("[loan_leads] update failed", error.message);
    return { error: "Could not update lead." };
  }
  return { ok: true };
}
