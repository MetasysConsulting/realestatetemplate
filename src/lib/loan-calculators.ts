export type LoanCalculatorSlug =
  | "mortgage-payment"
  | "affordability"
  | "refinance"
  | "loan-comparison"
  | "amortization"
  | "extra-payment"
  | "interest";

export type LoanCalculatorMeta = {
  slug: LoanCalculatorSlug;
  title: string;
  shortTitle: string;
  description: string;
  blurb: string;
};

export const LOAN_CALCULATORS: LoanCalculatorMeta[] = [
  {
    slug: "mortgage-payment",
    title: "Mortgage Payment Calculator",
    shortTitle: "Mortgage Payment",
    description: "Estimate principal & interest plus optional taxes, insurance, and HOA.",
    blurb: "Quick monthly payment estimate for a fixed-rate loan.",
  },
  {
    slug: "affordability",
    title: "Affordability Calculator",
    shortTitle: "Affordability",
    description: "Rough max loan size from monthly income and a housing DTI budget.",
    blurb: "See how much home you might afford before talking to a lender.",
  },
  {
    slug: "refinance",
    title: "Refinance Calculator",
    shortTitle: "Refinance",
    description: "Compare your current payment to a new rate and term.",
    blurb: "Check monthly savings and a simple closing-cost break-even.",
  },
  {
    slug: "loan-comparison",
    title: "Loan Comparison Calculator",
    shortTitle: "Compare Loans",
    description: "Side-by-side compare of two loan scenarios.",
    blurb: "Pick the option with the payment and interest profile you prefer.",
  },
  {
    slug: "amortization",
    title: "Amortization Schedule",
    shortTitle: "Amortization",
    description: "Month-by-month principal, interest, and remaining balance.",
    blurb: "See how every payment splits between interest and principal.",
  },
  {
    slug: "extra-payment",
    title: "Extra Payment Calculator",
    shortTitle: "Extra Payment",
    description: "Model how extra monthly principal shortens the loan.",
    blurb: "See interest saved and earlier payoff from paying a little more.",
  },
  {
    slug: "interest",
    title: "Interest Calculator",
    shortTitle: "Interest",
    description: "Total interest cost over the full term of a fixed-rate loan.",
    blurb: "Understand the true interest cost before you borrow.",
  },
];

export function getLoanCalculator(slug: string): LoanCalculatorMeta | undefined {
  return LOAN_CALCULATORS.find((item) => item.slug === slug);
}

export function isLoanCalculatorSlug(value: string): value is LoanCalculatorSlug {
  return LOAN_CALCULATORS.some((item) => item.slug === value);
}
