"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { updateLoanLead } from "@/lib/loans/loan-leads";
import { isLoanLeadStatus, type LoanLeadStatus } from "@/lib/loans/loan-types";

export async function updateLoanLeadAction(input: {
  id: string;
  status?: string;
  assignedTo?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  await requireAdminUser();

  const id = String(input.id ?? "").trim();
  if (!id) return { error: "Missing lead id." };

  let status: LoanLeadStatus | undefined;
  if (input.status != null) {
    if (!isLoanLeadStatus(input.status)) return { error: "Invalid status." };
    status = input.status;
  }

  const result = await updateLoanLead({
    id,
    status,
    assignedTo: input.assignedTo,
  });

  if ("error" in result) return result;
  revalidatePath("/admin/loan-leads");
  return { ok: true };
}
