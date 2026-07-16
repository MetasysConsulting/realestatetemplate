import type { Metadata } from "next";
import { FindLoanWizard } from "@/components/loans/FindLoanWizard";
import { LoansPageShell } from "@/components/loans/LoansPageShell";

export const metadata: Metadata = {
  title: "Find a Loan — REOVANA",
  description:
    "Multi-step investor loan wizard with formula-based estimates. Submit your deal details to REOVANA.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FindLoanPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const purposeRaw = params.purpose;
  const purpose = typeof purposeRaw === "string" ? purposeRaw : undefined;

  return (
    <LoansPageShell>
      <div className="find-loan-page">
        <div className="tf-container find-loan-page__inner">
          <header className="find-loan-page__header">
            <p className="find-loan-page__eyebrow">Find a Loan</p>
            <h1>Get a formula-based estimate for your deal</h1>
            <p>
              Answer a few questions about the property and your financing profile. We calculate
              an educational estimate with standard loan math — then save your request for the
              REOVANA team.
            </p>
          </header>
          <FindLoanWizard initialPurpose={purpose} />
        </div>
      </div>
    </LoansPageShell>
  );
}
