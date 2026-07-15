import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoansPageShell } from "@/components/loans/LoansPageShell";
import { LoanCalculatorWorkspace } from "@/components/loans/calculators/LoanCalculatorWorkspace";
import {
  getLoanCalculator,
  isLoanCalculatorSlug,
  LOAN_CALCULATORS,
} from "@/lib/loan-calculators";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return LOAN_CALCULATORS.map((calc) => ({ slug: calc.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const calc = getLoanCalculator(slug);
  if (!calc) return { title: "Loan Calculator — REOVANA" };
  return {
    title: `${calc.title} — REOVANA`,
    description: calc.description,
  };
}

export default async function LoanCalculatorPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isLoanCalculatorSlug(slug)) notFound();
  const calc = getLoanCalculator(slug)!;

  return (
    <LoansPageShell>
      <div className="loan-calc-page">
        <div className="tf-container">
          <header className="loan-calc-hero">
            <p className="loan-calc-hero__eyebrow">
              <Link href="/loans">Loans</Link>
              {" · "}
              <Link href="/loans/calculators">Calculators</Link>
            </p>
            <h1>{calc.title}</h1>
            <p>{calc.blurb}</p>
          </header>
          <LoanCalculatorWorkspace slug={slug} />
        </div>
      </div>
    </LoansPageShell>
  );
}
