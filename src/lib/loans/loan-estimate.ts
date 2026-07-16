/**
 * Investor / hard-money style loan estimates using local formulas only.
 * Rates and LTVs are mid-market heuristics for education — not lender quotes.
 */

import { monthlyPiPayment } from "@/lib/loan-calculator-math";
import type {
  CreditBandId,
  ExperienceId,
  LoanPurposeId,
  PropertyTypeId,
} from "@/lib/loans/loan-types";

export type LoanEstimateInput = {
  purpose: LoanPurposeId;
  purchasePrice: number;
  downPaymentPercent: number;
  rehabBudget?: number;
  afterRepairValue?: number;
  expectedMonthlyRent?: number;
  creditBand: CreditBandId;
  experience: ExperienceId;
  propertyType: PropertyTypeId;
};

export type LoanEstimateResult = {
  purpose: LoanPurposeId;
  paymentStyle: "interest_only" | "amortizing";
  estimatedRatePercent: number;
  termMonths: number;
  maxLtvPercent: number;
  requestedLoan: number;
  maxLoanByLtv: number;
  estimatedLoanAmount: number;
  monthlyPayment: number;
  estimatedPointsPercent: number;
  estimatedOriginationFee: number;
  totalInterestOverTerm: number;
  totalCostOverTerm: number;
  dscr: number | null;
  notes: string[];
  disclaimer: string;
};

type PurposeDefaults = {
  baseRate: number;
  termMonths: number;
  maxLtv: number;
  points: number;
  style: "interest_only" | "amortizing";
  amortYears?: number;
};

/** Mid-market private / investor lending heuristics (not bank quotes). */
const PURPOSE_DEFAULTS: Record<LoanPurposeId, PurposeDefaults> = {
  "fix-flip": { baseRate: 11.5, termMonths: 12, maxLtv: 0.7, points: 2, style: "interest_only" },
  rental: {
    baseRate: 8.25,
    termMonths: 360,
    maxLtv: 0.75,
    points: 1,
    style: "amortizing",
    amortYears: 30,
  },
  construction: { baseRate: 12, termMonths: 18, maxLtv: 0.7, points: 2.5, style: "interest_only" },
  commercial: {
    baseRate: 9,
    termMonths: 300,
    maxLtv: 0.65,
    points: 1.5,
    style: "amortizing",
    amortYears: 25,
  },
  bridge: { baseRate: 12.5, termMonths: 9, maxLtv: 0.65, points: 2, style: "interest_only" },
  auction: { baseRate: 12, termMonths: 12, maxLtv: 0.7, points: 2.5, style: "interest_only" },
};

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function creditAdj(band: CreditBandId): number {
  switch (band) {
    case "excellent":
      return -1;
    case "good":
      return 0;
    case "fair":
      return 1.25;
    case "poor":
      return 2.5;
  }
}

function experienceAdj(exp: ExperienceId): number {
  switch (exp) {
    case "experienced":
      return -0.5;
    case "some":
      return 0;
    case "none":
      return 0.75;
  }
}

function propertyAdj(type: PropertyTypeId): number {
  switch (type) {
    case "sfr":
    case "condo":
      return 0;
    case "multi":
      return 0.25;
    case "mf5":
      return 0.5;
    case "commercial":
      return 0.75;
    case "land":
      return 1.5;
  }
}

/**
 * Estimate a plausible private-lending package from wizard inputs.
 * Uses standard P&I amortization or interest-only math — no external APIs.
 */
export function estimateInvestorLoan(input: LoanEstimateInput): LoanEstimateResult {
  const defaults = PURPOSE_DEFAULTS[input.purpose];
  const purchase = Math.max(0, input.purchasePrice);
  const downPct = clamp(input.downPaymentPercent, 0, 90) / 100;
  const rehab = Math.max(0, input.rehabBudget ?? 0);
  const arv = Math.max(0, input.afterRepairValue ?? 0);
  const rent = Math.max(0, input.expectedMonthlyRent ?? 0);

  let rate =
    defaults.baseRate +
    creditAdj(input.creditBand) +
    experienceAdj(input.experience) +
    propertyAdj(input.propertyType);

  const requestedLtv = 1 - downPct;
  if (requestedLtv > defaults.maxLtv + 0.02) {
    rate += 0.5;
  }
  rate = clamp(rate, 5.5, 18);

  const notes: string[] = [];

  // Cap loan by purchase LTV and, when ARV is present (fix/flip/auction), ARV LTV.
  const maxByPurchase = purchase * defaults.maxLtv;
  let maxLoanByLtv = maxByPurchase;
  if (
    (input.purpose === "fix-flip" || input.purpose === "auction" || input.purpose === "construction") &&
    arv > 0
  ) {
    const maxByArv = arv * 0.7;
    maxLoanByLtv = Math.min(maxByPurchase + rehab * 0.9, maxByArv);
    notes.push("Loan capped using purchase LTV and ~70% of after-repair value (ARV).");
  } else if (input.purpose === "construction" && rehab > 0) {
    maxLoanByLtv = Math.min(purchase + rehab, (purchase + rehab) * defaults.maxLtv);
    notes.push("Construction estimate uses loan-to-cost style LTV on purchase + budget.");
  }

  const requestedLoan = Math.max(0, purchase * requestedLtv + (input.purpose === "construction" ? rehab * (1 - downPct) : 0));
  let estimatedLoanAmount = Math.min(requestedLoan, maxLoanByLtv);

  // DSCR screen for rentals when rent is provided (housing payment ≈ P&I only for estimate).
  let dscr: number | null = null;
  if (input.purpose === "rental" && rent > 0 && estimatedLoanAmount > 0) {
    const years = defaults.amortYears ?? 30;
    let pi = monthlyPiPayment(estimatedLoanAmount, rate, years);
    dscr = pi > 0 ? rent / pi : null;
    const targetDscr = 1.25;
    if (dscr != null && dscr < targetDscr) {
      // Scale loan so rent / PI ≈ 1.25
      const months = years * 12;
      const r = rate / 100 / 12;
      const maxPi = rent / targetDscr;
      let maxByDscr = 0;
      if (r === 0) {
        maxByDscr = maxPi * months;
      } else {
        const factor = Math.pow(1 + r, months);
        maxByDscr = (maxPi * (factor - 1)) / (r * factor);
      }
      if (maxByDscr < estimatedLoanAmount) {
        estimatedLoanAmount = Math.max(0, maxByDscr);
        pi = monthlyPiPayment(estimatedLoanAmount, rate, years);
        dscr = pi > 0 ? rent / pi : null;
        notes.push("Loan sized down so estimated DSCR stays near 1.25× (rent ÷ P&I).");
      }
    } else {
      notes.push("DSCR uses expected rent ÷ estimated principal & interest (taxes/insurance not included).");
    }
  }

  const points = defaults.points + (input.creditBand === "poor" ? 0.5 : 0);
  const estimatedOriginationFee = estimatedLoanAmount * (points / 100);

  let monthlyPayment = 0;
  let totalInterestOverTerm = 0;
  const termMonths = defaults.termMonths;

  if (defaults.style === "interest_only") {
    monthlyPayment = estimatedLoanAmount * (rate / 100 / 12);
    totalInterestOverTerm = monthlyPayment * termMonths;
    notes.push("Payment shown is interest-only (typical for short-term private loans); principal due at payoff.");
  } else {
    const years = defaults.amortYears ?? termMonths / 12;
    monthlyPayment = monthlyPiPayment(estimatedLoanAmount, rate, years);
    totalInterestOverTerm = monthlyPayment * termMonths - estimatedLoanAmount;
    notes.push(`Amortizing estimate assumes a ${years}-year schedule.`);
  }

  if (estimatedLoanAmount < requestedLoan - 1) {
    notes.push(
      `Requested leverage exceeds typical max LTV (~${Math.round(defaults.maxLtv * 100)}%); estimate uses the capped loan amount.`,
    );
  }

  return {
    purpose: input.purpose,
    paymentStyle: defaults.style,
    estimatedRatePercent: Math.round(rate * 100) / 100,
    termMonths,
    maxLtvPercent: Math.round(defaults.maxLtv * 100),
    requestedLoan: Math.round(requestedLoan),
    maxLoanByLtv: Math.round(maxLoanByLtv),
    estimatedLoanAmount: Math.round(estimatedLoanAmount),
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    estimatedPointsPercent: points,
    estimatedOriginationFee: Math.round(estimatedOriginationFee),
    totalInterestOverTerm: Math.round(totalInterestOverTerm),
    totalCostOverTerm: Math.round(totalInterestOverTerm + estimatedOriginationFee),
    dscr: dscr != null ? Math.round(dscr * 100) / 100 : null,
    notes,
    disclaimer:
      "This is an educational estimate from standard loan formulas and typical private-lending ranges. It is not a lender offer, pre-approval, or rate lock. Actual terms vary by lender, property, and underwriting.",
  };
}
