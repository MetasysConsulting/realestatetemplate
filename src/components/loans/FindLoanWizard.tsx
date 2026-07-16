"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { formatMoney, formatMoneyExact } from "@/lib/loan-calculator-math";
import {
  estimateInvestorLoan,
  type LoanEstimateResult,
} from "@/lib/loans/loan-estimate";
import {
  CREDIT_BAND_OPTIONS,
  EXPERIENCE_OPTIONS,
  LOAN_PURPOSE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  TIMELINE_OPTIONS,
  type CreditBandId,
  type ExperienceId,
  type LoanPurposeId,
  type PropertyTypeId,
  type TimelineId,
} from "@/lib/loans/loan-types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as const;

const STEPS = ["Purpose", "Property", "Financing", "Contact", "Estimate"] as const;

type WizardState = {
  purpose: LoanPurposeId | "";
  propertyType: PropertyTypeId | "";
  timeline: TimelineId | "";
  purchasePrice: string;
  downPaymentPercent: string;
  rehabBudget: string;
  afterRepairValue: string;
  expectedMonthlyRent: string;
  propertyCity: string;
  propertyState: string;
  creditBand: CreditBandId | "";
  experience: ExperienceId | "";
  fullName: string;
  email: string;
  phone: string;
  notes: string;
  companyWebsite: string;
};

const initialState: WizardState = {
  purpose: "",
  propertyType: "",
  timeline: "",
  purchasePrice: "",
  downPaymentPercent: "25",
  rehabBudget: "",
  afterRepairValue: "",
  expectedMonthlyRent: "",
  propertyCity: "",
  propertyState: "FL",
  creditBand: "",
  experience: "",
  fullName: "",
  email: "",
  phone: "",
  notes: "",
  companyWebsite: "",
};

function parseMoney(raw: string): number {
  return Number(String(raw).replace(/[$,\s]/g, ""));
}

export function FindLoanWizard({
  initialPurpose,
}: {
  initialPurpose?: string;
}) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(() => ({
    ...initialState,
    purpose:
      LOAN_PURPOSE_OPTIONS.some((o) => o.id === initialPurpose)
        ? (initialPurpose as LoanPurposeId)
        : "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [savedEstimate, setSavedEstimate] = useState<LoanEstimateResult | null>(null);

  const liveEstimate = useMemo(() => {
    if (
      !state.purpose ||
      !state.creditBand ||
      !state.experience ||
      !state.propertyType
    ) {
      return null;
    }
    const purchasePrice = parseMoney(state.purchasePrice);
    const downPaymentPercent = Number(state.downPaymentPercent);
    if (!(purchasePrice > 0) || !Number.isFinite(downPaymentPercent)) return null;

    return estimateInvestorLoan({
      purpose: state.purpose,
      purchasePrice,
      downPaymentPercent,
      rehabBudget: parseMoney(state.rehabBudget) || undefined,
      afterRepairValue: parseMoney(state.afterRepairValue) || undefined,
      expectedMonthlyRent: parseMoney(state.expectedMonthlyRent) || undefined,
      creditBand: state.creditBand,
      experience: state.experience,
      propertyType: state.propertyType,
    });
  }, [state]);

  const patch = (partial: Partial<WizardState>) => {
    setState((current) => ({ ...current, ...partial }));
    setError(null);
  };

  const validateStep = (): string | null => {
    if (step === 0 && !state.purpose) return "Select a loan purpose to continue.";
    if (step === 1) {
      if (!state.propertyType) return "Select a property type.";
      if (!state.timeline) return "Select your timeline.";
      if (!state.propertyCity.trim()) return "Enter the property city.";
      if (state.propertyState.length !== 2) return "Select a state.";
      if (!(parseMoney(state.purchasePrice) > 0)) return "Enter a purchase price.";
    }
    if (step === 2) {
      const down = Number(state.downPaymentPercent);
      if (!Number.isFinite(down) || down < 0 || down > 90) {
        return "Down payment must be between 0% and 90%.";
      }
      if (!state.creditBand) return "Select a credit band.";
      if (!state.experience) return "Select your experience level.";
    }
    if (step === 3) {
      if (!state.fullName.trim()) return "Enter your name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
        return "Enter a valid email.";
      }
    }
    return null;
  };

  const goNext = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    if (!liveEstimate || !state.purpose) {
      setError("Complete the earlier steps to generate an estimate.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/loans/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: state.purpose,
          propertyType: state.propertyType,
          timeline: state.timeline,
          purchasePrice: parseMoney(state.purchasePrice),
          downPaymentPercent: Number(state.downPaymentPercent),
          rehabBudget: parseMoney(state.rehabBudget) || null,
          afterRepairValue: parseMoney(state.afterRepairValue) || null,
          expectedMonthlyRent: parseMoney(state.expectedMonthlyRent) || null,
          propertyCity: state.propertyCity,
          propertyState: state.propertyState,
          creditBand: state.creditBand,
          experience: state.experience,
          fullName: state.fullName,
          email: state.email,
          phone: state.phone || null,
          notes: state.notes || null,
          companyWebsite: state.companyWebsite,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        estimate?: LoanEstimateResult;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.id) {
        setError(data.error ?? "Could not submit. Please try again.");
        return;
      }
      setSubmittedId(data.id);
      setSavedEstimate(data.estimate ?? liveEstimate);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  };

  if (submittedId && savedEstimate) {
    return (
      <div className="find-loan-wizard find-loan-wizard--done">
        <p className="find-loan-wizard__eyebrow">Request received</p>
        <h2>Thanks — your estimate is ready</h2>
        <p className="find-loan-wizard__lead">
          We saved your details for the REOVANA team. A specialist can follow up using the
          contact info you provided.
        </p>
        <EstimatePanel estimate={savedEstimate} />
        <div className="find-loan-wizard__actions">
          <Link href="/loans/calculators" className="loans-btn loans-btn--secondary">
            Explore calculators
          </Link>
          <Link href="/search" className="loans-btn loans-btn--primary">
            Browse properties
          </Link>
        </div>
      </div>
    );
  }

  const showRehab =
    state.purpose === "fix-flip" ||
    state.purpose === "construction" ||
    state.purpose === "auction";
  const showRent = state.purpose === "rental";

  return (
    <form className="find-loan-wizard" onSubmit={(e) => void onSubmit(e)}>
      <div className="find-loan-wizard__progress" aria-hidden="true">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`find-loan-wizard__step-pill${index === step ? " is-active" : ""}${index < step ? " is-done" : ""}`}
          >
            <span>{index + 1}</span>
            {label}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <section className="find-loan-wizard__panel">
          <h2>What kind of financing do you need?</h2>
          <p>Pick the closest match — we’ll estimate terms for that loan style.</p>
          <div className="find-loan-wizard__purpose-grid">
            {LOAN_PURPOSE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`find-loan-wizard__purpose${state.purpose === option.id ? " is-selected" : ""}`}
                onClick={() => patch({ purpose: option.id })}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="find-loan-wizard__panel">
          <h2>Tell us about the property</h2>
          <div className="find-loan-wizard__grid">
            <label className="find-loan-wizard__field">
              <span>Property type</span>
              <select
                value={state.propertyType}
                onChange={(e) => patch({ propertyType: e.target.value as PropertyTypeId })}
              >
                <option value="">Select…</option>
                {PROPERTY_TYPE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="find-loan-wizard__field">
              <span>Funding timeline</span>
              <select
                value={state.timeline}
                onChange={(e) => patch({ timeline: e.target.value as TimelineId })}
              >
                <option value="">Select…</option>
                {TIMELINE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="find-loan-wizard__field">
              <span>City</span>
              <input
                value={state.propertyCity}
                onChange={(e) => patch({ propertyCity: e.target.value })}
                placeholder="Miami"
              />
            </label>
            <label className="find-loan-wizard__field">
              <span>State</span>
              <select
                value={state.propertyState}
                onChange={(e) => patch({ propertyState: e.target.value })}
              >
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="find-loan-wizard__field">
              <span>Purchase price</span>
              <input
                inputMode="decimal"
                value={state.purchasePrice}
                onChange={(e) => patch({ purchasePrice: e.target.value })}
                placeholder="350000"
              />
            </label>
            {showRehab ? (
              <>
                <label className="find-loan-wizard__field">
                  <span>Rehab / construction budget (optional)</span>
                  <input
                    inputMode="decimal"
                    value={state.rehabBudget}
                    onChange={(e) => patch({ rehabBudget: e.target.value })}
                    placeholder="50000"
                  />
                </label>
                <label className="find-loan-wizard__field">
                  <span>After-repair value / ARV (optional)</span>
                  <input
                    inputMode="decimal"
                    value={state.afterRepairValue}
                    onChange={(e) => patch({ afterRepairValue: e.target.value })}
                    placeholder="450000"
                  />
                </label>
              </>
            ) : null}
            {showRent ? (
              <label className="find-loan-wizard__field">
                <span>Expected monthly rent (optional)</span>
                <input
                  inputMode="decimal"
                  value={state.expectedMonthlyRent}
                  onChange={(e) => patch({ expectedMonthlyRent: e.target.value })}
                  placeholder="2800"
                />
              </label>
            ) : null}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="find-loan-wizard__panel">
          <h2>Financing profile</h2>
          <div className="find-loan-wizard__grid">
            <label className="find-loan-wizard__field">
              <span>Down payment (%)</span>
              <input
                inputMode="decimal"
                value={state.downPaymentPercent}
                onChange={(e) => patch({ downPaymentPercent: e.target.value })}
              />
            </label>
            <label className="find-loan-wizard__field">
              <span>Credit band</span>
              <select
                value={state.creditBand}
                onChange={(e) => patch({ creditBand: e.target.value as CreditBandId })}
              >
                <option value="">Select…</option>
                {CREDIT_BAND_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="find-loan-wizard__field find-loan-wizard__field--full">
              <span>Investor experience</span>
              <select
                value={state.experience}
                onChange={(e) => patch({ experience: e.target.value as ExperienceId })}
              >
                <option value="">Select…</option>
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="find-loan-wizard__panel">
          <h2>How should we reach you?</h2>
          <div className="find-loan-wizard__grid">
            <label className="find-loan-wizard__field">
              <span>Full name</span>
              <input
                value={state.fullName}
                onChange={(e) => patch({ fullName: e.target.value })}
                autoComplete="name"
              />
            </label>
            <label className="find-loan-wizard__field">
              <span>Email</span>
              <input
                type="email"
                value={state.email}
                onChange={(e) => patch({ email: e.target.value })}
                autoComplete="email"
              />
            </label>
            <label className="find-loan-wizard__field">
              <span>Phone (optional)</span>
              <input
                type="tel"
                value={state.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                autoComplete="tel"
              />
            </label>
            <label className="find-loan-wizard__field find-loan-wizard__field--full">
              <span>Notes for lenders (optional)</span>
              <textarea
                rows={3}
                value={state.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Deal context, closing date, special circumstances…"
              />
            </label>
            <label className="find-loan-wizard__honeypot" aria-hidden="true">
              Company website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={state.companyWebsite}
                onChange={(e) => patch({ companyWebsite: e.target.value })}
              />
            </label>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="find-loan-wizard__panel">
          <h2>Your formula-based estimate</h2>
          <p>
            Built with standard amortization / interest-only math and typical private-lending
            ranges — no external quote APIs.
          </p>
          {liveEstimate ? <EstimatePanel estimate={liveEstimate} /> : (
            <p className="find-loan-wizard__error">Missing inputs for an estimate.</p>
          )}
        </section>
      ) : null}

      {error ? <p className="find-loan-wizard__error">{error}</p> : null}

      <div className="find-loan-wizard__actions">
        {step > 0 ? (
          <button type="button" className="loans-btn loans-btn--secondary" onClick={goBack}>
            Back
          </button>
        ) : (
          <Link href="/loans" className="loans-btn loans-btn--secondary">
            Back to Loans
          </Link>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="loans-btn loans-btn--primary" onClick={goNext}>
            Continue
          </button>
        ) : (
          <button type="submit" className="loans-btn loans-btn--primary" disabled={pending}>
            {pending ? "Submitting…" : "Submit & save estimate"}
          </button>
        )}
      </div>
    </form>
  );
}

function EstimatePanel({ estimate }: { estimate: LoanEstimateResult }) {
  return (
    <div className="find-loan-estimate">
      <div className="find-loan-estimate__grid">
        <div>
          <span>Estimated loan</span>
          <strong>{formatMoney(estimate.estimatedLoanAmount)}</strong>
        </div>
        <div>
          <span>Est. rate</span>
          <strong>{estimate.estimatedRatePercent.toFixed(2)}%</strong>
        </div>
        <div>
          <span>
            {estimate.paymentStyle === "interest_only" ? "Monthly interest" : "Monthly P&I"}
          </span>
          <strong>{formatMoneyExact(estimate.monthlyPayment)}</strong>
        </div>
        <div>
          <span>Term</span>
          <strong>
            {estimate.termMonths >= 24
              ? `${Math.round(estimate.termMonths / 12)} years`
              : `${estimate.termMonths} months`}
          </strong>
        </div>
        <div>
          <span>Max LTV used</span>
          <strong>{estimate.maxLtvPercent}%</strong>
        </div>
        <div>
          <span>Est. points / fees</span>
          <strong>
            {estimate.estimatedPointsPercent}% · {formatMoney(estimate.estimatedOriginationFee)}
          </strong>
        </div>
        {estimate.dscr != null ? (
          <div>
            <span>Est. DSCR</span>
            <strong>{estimate.dscr.toFixed(2)}×</strong>
          </div>
        ) : null}
        <div>
          <span>Interest over term (est.)</span>
          <strong>{formatMoney(estimate.totalInterestOverTerm)}</strong>
        </div>
      </div>
      {estimate.notes.length ? (
        <ul className="find-loan-estimate__notes">
          {estimate.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
      <p className="find-loan-estimate__disclaimer">{estimate.disclaimer}</p>
    </div>
  );
}
