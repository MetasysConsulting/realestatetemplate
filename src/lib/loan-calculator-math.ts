/** Standard amortizing loan math for on-site estimators (no external API). */

export type AmortizationRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  extra: number;
  balance: number;
};

export type LoanPaymentSummary = {
  monthlyPrincipalAndInterest: number;
  totalPayments: number;
  totalInterest: number;
  payoffMonths: number;
};

function clampNonNeg(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** Monthly payment for principal & interest (standard amortization). */
export function monthlyPiPayment(
  principal: number,
  annualRatePercent: number,
  termYears: number,
): number {
  const P = clampNonNeg(principal);
  const months = Math.max(1, Math.round(clampNonNeg(termYears) * 12));
  const r = clampNonNeg(annualRatePercent) / 100 / 12;
  if (P <= 0) return 0;
  if (r === 0) return P / months;
  const factor = Math.pow(1 + r, months);
  return (P * r * factor) / (factor - 1);
}

export function buildAmortizationSchedule(input: {
  principal: number;
  annualRatePercent: number;
  termYears: number;
  extraMonthly?: number;
}): { rows: AmortizationRow[]; summary: LoanPaymentSummary } {
  const P0 = clampNonNeg(input.principal);
  const months = Math.max(1, Math.round(clampNonNeg(input.termYears) * 12));
  const r = clampNonNeg(input.annualRatePercent) / 100 / 12;
  const basePayment = monthlyPiPayment(P0, input.annualRatePercent, input.termYears);
  const extra = clampNonNeg(input.extraMonthly ?? 0);

  const rows: AmortizationRow[] = [];
  let balance = P0;
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;

  while (balance > 0.005 && month < months + 600) {
    month += 1;
    const interest = r === 0 ? 0 : balance * r;
    let principalPaid = basePayment - interest;
    let payment = basePayment;
    let extraApplied = extra;

    if (principalPaid + extraApplied > balance) {
      extraApplied = Math.max(0, balance - principalPaid);
      if (principalPaid > balance) {
        principalPaid = balance;
        payment = principalPaid + interest;
        extraApplied = 0;
      } else {
        payment = principalPaid + interest + extraApplied;
      }
    } else {
      payment = basePayment + extraApplied;
    }

    balance = Math.max(0, balance - principalPaid - extraApplied);
    totalInterest += interest;
    totalPaid += payment;

    rows.push({
      month,
      payment,
      principal: principalPaid,
      interest,
      extra: extraApplied,
      balance,
    });

    if (balance <= 0.005) break;
  }

  return {
    rows,
    summary: {
      monthlyPrincipalAndInterest: basePayment,
      totalPayments: totalPaid,
      totalInterest,
      payoffMonths: month,
    },
  };
}

export function maxAffordableLoan(input: {
  monthlyIncome: number;
  /** Debt-to-income budget for housing PI only, e.g. 0.28 */
  housingDti?: number;
  annualRatePercent: number;
  termYears: number;
  monthlyTaxesInsuranceHoa?: number;
}): { maxLoan: number; maxMonthlyPi: number; estimatedHomePrice: number } {
  const income = clampNonNeg(input.monthlyIncome);
  const dti = input.housingDti != null && input.housingDti > 0 ? input.housingDti : 0.28;
  const other = clampNonNeg(input.monthlyTaxesInsuranceHoa ?? 0);
  const maxMonthlyPi = Math.max(0, income * dti - other);
  const months = Math.max(1, Math.round(clampNonNeg(input.termYears) * 12));
  const r = clampNonNeg(input.annualRatePercent) / 100 / 12;

  let maxLoan = 0;
  if (maxMonthlyPi <= 0) {
    maxLoan = 0;
  } else if (r === 0) {
    maxLoan = maxMonthlyPi * months;
  } else {
    const factor = Math.pow(1 + r, months);
    maxLoan = (maxMonthlyPi * (factor - 1)) / (r * factor);
  }

  // Rough home price assuming 20% down
  const estimatedHomePrice = maxLoan > 0 ? maxLoan / 0.8 : 0;
  return { maxLoan, maxMonthlyPi, estimatedHomePrice };
}

export function refinanceComparison(input: {
  remainingBalance: number;
  currentRatePercent: number;
  remainingYears: number;
  newRatePercent: number;
  newTermYears: number;
  closingCosts?: number;
}): {
  currentMonthly: number;
  newMonthly: number;
  monthlySavings: number;
  currentTotalInterest: number;
  newTotalInterest: number;
  breakEvenMonths: number | null;
} {
  const balance = clampNonNeg(input.remainingBalance);
  const closing = clampNonNeg(input.closingCosts ?? 0);
  const current = buildAmortizationSchedule({
    principal: balance,
    annualRatePercent: input.currentRatePercent,
    termYears: input.remainingYears,
  });
  const next = buildAmortizationSchedule({
    principal: balance,
    annualRatePercent: input.newRatePercent,
    termYears: input.newTermYears,
  });
  const monthlySavings =
    current.summary.monthlyPrincipalAndInterest - next.summary.monthlyPrincipalAndInterest;
  const breakEvenMonths =
    monthlySavings > 0.5 ? Math.ceil(closing / monthlySavings) : null;

  return {
    currentMonthly: current.summary.monthlyPrincipalAndInterest,
    newMonthly: next.summary.monthlyPrincipalAndInterest,
    monthlySavings,
    currentTotalInterest: current.summary.totalInterest,
    newTotalInterest: next.summary.totalInterest,
    breakEvenMonths,
  };
}

export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyExact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMonthsAsYears(months: number): string {
  const m = Math.max(0, Math.round(months));
  const years = Math.floor(m / 12);
  const rem = m % 12;
  if (years <= 0) return `${rem} mo`;
  if (rem === 0) return `${years} yr`;
  return `${years} yr ${rem} mo`;
}
