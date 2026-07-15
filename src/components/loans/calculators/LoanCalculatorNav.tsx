import Link from "next/link";
import { LOAN_CALCULATORS, type LoanCalculatorSlug } from "@/lib/loan-calculators";

export function LoanCalculatorNav({ active }: { active?: LoanCalculatorSlug }) {
  return (
    <nav className="loan-calc-nav" aria-label="Loan calculators">
      <Link href="/loans/calculators" className={!active ? "is-active" : undefined}>
        All tools
      </Link>
      {LOAN_CALCULATORS.map((calc) => (
        <Link
          key={calc.slug}
          href={`/loans/calculators/${calc.slug}`}
          className={active === calc.slug ? "is-active" : undefined}
        >
          {calc.shortTitle}
        </Link>
      ))}
    </nav>
  );
}
