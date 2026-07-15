import type { Metadata } from "next";
import Link from "next/link";
import { LoansPageShell } from "@/components/loans/LoansPageShell";
import { LoanCalculatorNav } from "@/components/loans/calculators/LoanCalculatorNav";
import { LOAN_CALCULATORS } from "@/lib/loan-calculators";

export const metadata: Metadata = {
  title: "Loan Calculators — REOVANA",
  description:
    "Free mortgage and loan estimators: payment, affordability, refinance, comparison, amortization, and more.",
};

export default function LoanCalculatorsHubPage() {
  return (
    <LoansPageShell>
      <div className="loan-calc-page loan-calc-page--hub">
        <div className="tf-container">
          <header className="loan-calc-hero">
            <p className="loan-calc-hero__eyebrow">Loans · Estimators</p>
            <h1>Loan Calculators</h1>
            <p>
              Play with the numbers — estimates only, not loan offers. When you&apos;re ready,
              explore financing solutions for distressed deals.
            </p>
          </header>

          <LoanCalculatorNav />

          <ul className="loan-calc-hub-grid">
            {LOAN_CALCULATORS.map((calc) => (
              <li key={calc.slug}>
                <Link href={`/loans/calculators/${calc.slug}`} className="loan-calc-hub-card">
                  <h2>{calc.title}</h2>
                  <p>{calc.description}</p>
                  <span>Open calculator →</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="loan-calc-hub-back">
            <Link href="/loans">← Back to Loans</Link>
          </p>
        </div>
      </div>
    </LoansPageShell>
  );
}
