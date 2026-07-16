import LoanLeadsAdmin from "@/views/admin/loan-leads";
import { listLoanLeads } from "@/lib/loans/loan-leads";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoanLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status =
    typeof params.status === "string" && params.status.trim()
      ? params.status.trim()
      : "all";
  const q = typeof params.q === "string" ? params.q : "";

  const data = await listLoanLeads({ status, q, limit: 150 });

  return (
    <LoanLeadsAdmin
      available={data.available}
      leads={data.leads}
      statusFilter={status}
      q={q}
    />
  );
}
