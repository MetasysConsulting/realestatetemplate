"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LoanCalculatorSlug } from "@/lib/loan-calculators";
import {
  buildAmortizationSchedule,
  formatMoney,
  formatMoneyExact,
  formatMonthsAsYears,
  maxAffordableLoan,
  monthlyPiPayment,
  refinanceComparison,
} from "@/lib/loan-calculator-math";
import { LoanCalculatorNav } from "./LoanCalculatorNav";

function num(value: string, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function Field({
  label,
  value,
  onChange,
  suffix,
  step = "1",
  min = "0",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  step?: string;
  min?: string;
}) {
  return (
    <label className="loan-calc-field">
      <span>{label}</span>
      <div className="loan-calc-field__input">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix ? <em>{suffix}</em> : null}
      </div>
    </label>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="loan-calc-result">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FindLoanCta() {
  return (
    <div className="loan-calc-lead">
      <p>
        These estimates are for planning only — not a loan offer or commitment. Ready for
        real options?
      </p>
      <Link href="/loans#solutions" className="loans-btn loans-btn--primary">
        Explore loan solutions
        <span aria-hidden="true">→</span>
      </Link>
      <p className="loan-calc-lead__hint">
        Full Find a Loan matching wizard comes next — for now browse solutions or contact us.
      </p>
    </div>
  );
}

function AmortTable({
  rows,
}: {
  rows: ReturnType<typeof buildAmortizationSchedule>["rows"];
}) {
  const preview = rows.slice(0, 24);
  return (
    <div className="loan-calc-table-wrap">
      <table className="loan-calc-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Payment</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Extra</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {preview.map((row) => (
            <tr key={row.month}>
              <td>{row.month}</td>
              <td>{formatMoneyExact(row.payment)}</td>
              <td>{formatMoneyExact(row.principal)}</td>
              <td>{formatMoneyExact(row.interest)}</td>
              <td>{formatMoneyExact(row.extra)}</td>
              <td>{formatMoneyExact(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 24 ? (
        <p className="loan-calc-table-note">Showing first 24 months of {rows.length}.</p>
      ) : null}
    </div>
  );
}

export function LoanCalculatorWorkspace({ slug }: { slug: LoanCalculatorSlug }) {
  const [homePrice, setHomePrice] = useState("350000");
  const [downPayment, setDownPayment] = useState("70000");
  const [rate, setRate] = useState("6.75");
  const [years, setYears] = useState("30");
  const [tax, setTax] = useState("4200");
  const [insurance, setInsurance] = useState("1800");
  const [hoa, setHoa] = useState("0");

  const [income, setIncome] = useState("8500");
  const [dti, setDti] = useState("28");
  const [otherHousing, setOtherHousing] = useState("550");

  const [balance, setBalance] = useState("280000");
  const [currentRate, setCurrentRate] = useState("7.25");
  const [remainYears, setRemainYears] = useState("27");
  const [newRate, setNewRate] = useState("6.25");
  const [newYears, setNewYears] = useState("30");
  const [closing, setClosing] = useState("4500");

  const [aPrincipal, setAPrincipal] = useState("300000");
  const [aRate, setARate] = useState("6.5");
  const [aYears, setAYears] = useState("30");
  const [bPrincipal, setBPrincipal] = useState("300000");
  const [bRate, setBRate] = useState("6.9");
  const [bYears, setBYears] = useState("15");

  const [extra, setExtra] = useState("200");

  const loanAmount = Math.max(0, num(homePrice) - num(downPayment));

  const body = useMemo(() => {
    if (slug === "mortgage-payment") {
      const pi = monthlyPiPayment(loanAmount, num(rate), num(years));
      const monthlyTax = num(tax) / 12;
      const monthlyIns = num(insurance) / 12;
      const monthlyHoa = num(hoa);
      const total = pi + monthlyTax + monthlyIns + monthlyHoa;
      const schedule = buildAmortizationSchedule({
        principal: loanAmount,
        annualRatePercent: num(rate),
        termYears: num(years),
      });
      return (
        <>
          <div className="loan-calc-grid">
            <Field label="Home price" value={homePrice} onChange={setHomePrice} suffix="$" />
            <Field label="Down payment" value={downPayment} onChange={setDownPayment} suffix="$" />
            <Field label="Interest rate" value={rate} onChange={setRate} suffix="%" step="0.01" />
            <Field label="Term" value={years} onChange={setYears} suffix="years" />
            <Field label="Annual property tax" value={tax} onChange={setTax} suffix="$" />
            <Field
              label="Annual home insurance"
              value={insurance}
              onChange={setInsurance}
              suffix="$"
            />
            <Field label="Monthly HOA" value={hoa} onChange={setHoa} suffix="$" />
          </div>
          <div className="loan-calc-results">
            <ResultCard label="Loan amount" value={formatMoney(loanAmount)} />
            <ResultCard label="P&I" value={formatMoneyExact(pi)} />
            <ResultCard label="Est. total monthly" value={formatMoneyExact(total)} />
            <ResultCard
              label="Total interest"
              value={formatMoney(schedule.summary.totalInterest)}
            />
          </div>
        </>
      );
    }

    if (slug === "affordability") {
      const result = maxAffordableLoan({
        monthlyIncome: num(income),
        housingDti: num(dti) / 100,
        annualRatePercent: num(rate),
        termYears: num(years),
        monthlyTaxesInsuranceHoa: num(otherHousing),
      });
      return (
        <>
          <div className="loan-calc-grid">
            <Field label="Monthly gross income" value={income} onChange={setIncome} suffix="$" />
            <Field label="Housing DTI budget" value={dti} onChange={setDti} suffix="%" step="0.1" />
            <Field label="Interest rate" value={rate} onChange={setRate} suffix="%" step="0.01" />
            <Field label="Term" value={years} onChange={setYears} suffix="years" />
            <Field
              label="Monthly tax / insurance / HOA"
              value={otherHousing}
              onChange={setOtherHousing}
              suffix="$"
            />
          </div>
          <div className="loan-calc-results">
            <ResultCard label="Max P&I budget" value={formatMoneyExact(result.maxMonthlyPi)} />
            <ResultCard label="Max loan" value={formatMoney(result.maxLoan)} />
            <ResultCard
              label="Est. home price (20% down)"
              value={formatMoney(result.estimatedHomePrice)}
            />
          </div>
        </>
      );
    }

    if (slug === "refinance") {
      const result = refinanceComparison({
        remainingBalance: num(balance),
        currentRatePercent: num(currentRate),
        remainingYears: num(remainYears),
        newRatePercent: num(newRate),
        newTermYears: num(newYears),
        closingCosts: num(closing),
      });
      return (
        <>
          <div className="loan-calc-grid">
            <Field label="Remaining balance" value={balance} onChange={setBalance} suffix="$" />
            <Field
              label="Current rate"
              value={currentRate}
              onChange={setCurrentRate}
              suffix="%"
              step="0.01"
            />
            <Field
              label="Years left"
              value={remainYears}
              onChange={setRemainYears}
              suffix="years"
              step="0.5"
            />
            <Field label="New rate" value={newRate} onChange={setNewRate} suffix="%" step="0.01" />
            <Field label="New term" value={newYears} onChange={setNewYears} suffix="years" />
            <Field label="Closing costs" value={closing} onChange={setClosing} suffix="$" />
          </div>
          <div className="loan-calc-results">
            <ResultCard label="Current payment" value={formatMoneyExact(result.currentMonthly)} />
            <ResultCard label="New payment" value={formatMoneyExact(result.newMonthly)} />
            <ResultCard label="Monthly savings" value={formatMoneyExact(result.monthlySavings)} />
            <ResultCard
              label="Break-even"
              value={
                result.breakEvenMonths != null
                  ? formatMonthsAsYears(result.breakEvenMonths)
                  : "N/A"
              }
            />
          </div>
        </>
      );
    }

    if (slug === "loan-comparison") {
      const a = buildAmortizationSchedule({
        principal: num(aPrincipal),
        annualRatePercent: num(aRate),
        termYears: num(aYears),
      });
      const b = buildAmortizationSchedule({
        principal: num(bPrincipal),
        annualRatePercent: num(bRate),
        termYears: num(bYears),
      });
      return (
        <>
          <div className="loan-calc-compare">
            <div>
              <h3>Loan A</h3>
              <div className="loan-calc-grid">
                <Field label="Principal" value={aPrincipal} onChange={setAPrincipal} suffix="$" />
                <Field label="Rate" value={aRate} onChange={setARate} suffix="%" step="0.01" />
                <Field label="Term" value={aYears} onChange={setAYears} suffix="years" />
              </div>
              <div className="loan-calc-results loan-calc-results--compact">
                <ResultCard
                  label="Monthly P&I"
                  value={formatMoneyExact(a.summary.monthlyPrincipalAndInterest)}
                />
                <ResultCard label="Total interest" value={formatMoney(a.summary.totalInterest)} />
              </div>
            </div>
            <div>
              <h3>Loan B</h3>
              <div className="loan-calc-grid">
                <Field label="Principal" value={bPrincipal} onChange={setBPrincipal} suffix="$" />
                <Field label="Rate" value={bRate} onChange={setBRate} suffix="%" step="0.01" />
                <Field label="Term" value={bYears} onChange={setBYears} suffix="years" />
              </div>
              <div className="loan-calc-results loan-calc-results--compact">
                <ResultCard
                  label="Monthly P&I"
                  value={formatMoneyExact(b.summary.monthlyPrincipalAndInterest)}
                />
                <ResultCard label="Total interest" value={formatMoney(b.summary.totalInterest)} />
              </div>
            </div>
          </div>
        </>
      );
    }

    if (slug === "amortization") {
      const schedule = buildAmortizationSchedule({
        principal: num(aPrincipal),
        annualRatePercent: num(aRate),
        termYears: num(aYears),
      });
      return (
        <>
          <div className="loan-calc-grid">
            <Field label="Loan amount" value={aPrincipal} onChange={setAPrincipal} suffix="$" />
            <Field label="Interest rate" value={aRate} onChange={setARate} suffix="%" step="0.01" />
            <Field label="Term" value={aYears} onChange={setAYears} suffix="years" />
          </div>
          <div className="loan-calc-results">
            <ResultCard
              label="Monthly P&I"
              value={formatMoneyExact(schedule.summary.monthlyPrincipalAndInterest)}
            />
            <ResultCard label="Total interest" value={formatMoney(schedule.summary.totalInterest)} />
            <ResultCard
              label="Total paid"
              value={formatMoney(schedule.summary.totalPayments)}
            />
          </div>
          <AmortTable rows={schedule.rows} />
        </>
      );
    }

    if (slug === "extra-payment") {
      const base = buildAmortizationSchedule({
        principal: num(aPrincipal),
        annualRatePercent: num(aRate),
        termYears: num(aYears),
      });
      const withExtra = buildAmortizationSchedule({
        principal: num(aPrincipal),
        annualRatePercent: num(aRate),
        termYears: num(aYears),
        extraMonthly: num(extra),
      });
      const interestSaved = base.summary.totalInterest - withExtra.summary.totalInterest;
      const monthsSaved = base.summary.payoffMonths - withExtra.summary.payoffMonths;
      return (
        <>
          <div className="loan-calc-grid">
            <Field label="Loan amount" value={aPrincipal} onChange={setAPrincipal} suffix="$" />
            <Field label="Interest rate" value={aRate} onChange={setARate} suffix="%" step="0.01" />
            <Field label="Term" value={aYears} onChange={setAYears} suffix="years" />
            <Field label="Extra monthly principal" value={extra} onChange={setExtra} suffix="$" />
          </div>
          <div className="loan-calc-results">
            <ResultCard
              label="Payoff with extras"
              value={formatMonthsAsYears(withExtra.summary.payoffMonths)}
            />
            <ResultCard label="Time saved" value={formatMonthsAsYears(monthsSaved)} />
            <ResultCard label="Interest saved" value={formatMoney(interestSaved)} />
            <ResultCard
              label="Base monthly P&I"
              value={formatMoneyExact(base.summary.monthlyPrincipalAndInterest)}
            />
          </div>
          <AmortTable rows={withExtra.rows} />
        </>
      );
    }

    // interest
    const schedule = buildAmortizationSchedule({
      principal: num(aPrincipal),
      annualRatePercent: num(aRate),
      termYears: num(aYears),
    });
    const ratio =
      schedule.summary.totalPayments > 0
        ? (schedule.summary.totalInterest / schedule.summary.totalPayments) * 100
        : 0;
    return (
      <>
        <div className="loan-calc-grid">
          <Field label="Loan amount" value={aPrincipal} onChange={setAPrincipal} suffix="$" />
          <Field label="Interest rate" value={aRate} onChange={setARate} suffix="%" step="0.01" />
          <Field label="Term" value={aYears} onChange={setAYears} suffix="years" />
        </div>
        <div className="loan-calc-results">
          <ResultCard
            label="Monthly P&I"
            value={formatMoneyExact(schedule.summary.monthlyPrincipalAndInterest)}
          />
          <ResultCard label="Total interest" value={formatMoney(schedule.summary.totalInterest)} />
          <ResultCard label="Total of payments" value={formatMoney(schedule.summary.totalPayments)} />
          <ResultCard label="Interest share" value={`${ratio.toFixed(1)}%`} />
        </div>
      </>
    );
  }, [
    slug,
    homePrice,
    downPayment,
    rate,
    years,
    tax,
    insurance,
    hoa,
    loanAmount,
    income,
    dti,
    otherHousing,
    balance,
    currentRate,
    remainYears,
    newRate,
    newYears,
    closing,
    aPrincipal,
    aRate,
    aYears,
    bPrincipal,
    bRate,
    bYears,
    extra,
  ]);

  return (
    <div className="loan-calc-page">
      <LoanCalculatorNav active={slug} />
      <div className="loan-calc-workspace">{body}</div>
      <FindLoanCta />
    </div>
  );
}
