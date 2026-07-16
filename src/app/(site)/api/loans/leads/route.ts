import { NextResponse, type NextRequest } from "next/server";
import { estimateInvestorLoan } from "@/lib/loans/loan-estimate";
import { insertLoanLead } from "@/lib/loans/loan-leads";
import {
  isLoanPurposeId,
  type CreditBandId,
  type ExperienceId,
  type PropertyTypeId,
  type TimelineId,
} from "@/lib/loans/loan-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX;
}

function str(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function POST(request: NextRequest) {
  const key = clientKey(request);
  if (isRateLimited(key)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot
  if (str(body.companyWebsite)) {
    return NextResponse.json({ ok: true });
  }

  const purpose = str(body.purpose, 40);
  if (!isLoanPurposeId(purpose)) {
    return NextResponse.json({ error: "Choose a loan purpose." }, { status: 400 });
  }

  const fullName = str(body.fullName, 120);
  const email = str(body.email, 254).toLowerCase();
  const phone = str(body.phone, 40) || null;
  const propertyCity = str(body.propertyCity, 120);
  const propertyState = str(body.propertyState, 2).toUpperCase();
  const purchasePrice = num(body.purchasePrice);
  const downPaymentPercent = num(body.downPaymentPercent);
  const creditBand = str(body.creditBand, 40) as CreditBandId;
  const experience = str(body.experience, 40) as ExperienceId;
  const propertyType = str(body.propertyType, 40) as PropertyTypeId;
  const timeline = str(body.timeline, 40) as TimelineId;

  if (!fullName || !isEmail(email)) {
    return NextResponse.json({ error: "Enter a valid name and email." }, { status: 400 });
  }
  if (!propertyCity || propertyState.length !== 2) {
    return NextResponse.json({ error: "Enter property city and state." }, { status: 400 });
  }
  if (!(purchasePrice > 0) || !(downPaymentPercent >= 0 && downPaymentPercent <= 90)) {
    return NextResponse.json({ error: "Check purchase price and down payment." }, { status: 400 });
  }
  if (!creditBand || !experience || !propertyType || !timeline) {
    return NextResponse.json({ error: "Complete all required fields." }, { status: 400 });
  }

  const rehabBudget = num(body.rehabBudget);
  const afterRepairValue = num(body.afterRepairValue);
  const expectedMonthlyRent = num(body.expectedMonthlyRent);

  const estimate = estimateInvestorLoan({
    purpose,
    purchasePrice,
    downPaymentPercent,
    rehabBudget: Number.isFinite(rehabBudget) && rehabBudget > 0 ? rehabBudget : undefined,
    afterRepairValue:
      Number.isFinite(afterRepairValue) && afterRepairValue > 0 ? afterRepairValue : undefined,
    expectedMonthlyRent:
      Number.isFinite(expectedMonthlyRent) && expectedMonthlyRent > 0
        ? expectedMonthlyRent
        : undefined,
    creditBand,
    experience,
    propertyType,
  });

  const result = await insertLoanLead({
    purpose,
    propertyType,
    timeline,
    purchasePrice,
    downPaymentPercent,
    rehabBudget: Number.isFinite(rehabBudget) && rehabBudget > 0 ? rehabBudget : null,
    afterRepairValue:
      Number.isFinite(afterRepairValue) && afterRepairValue > 0 ? afterRepairValue : null,
    expectedMonthlyRent:
      Number.isFinite(expectedMonthlyRent) && expectedMonthlyRent > 0
        ? expectedMonthlyRent
        : null,
    propertyCity,
    propertyState,
    creditBand,
    experience,
    fullName,
    email,
    phone,
    notes: str(body.notes, 2000) || null,
    estimate,
    metadata: {
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({ ok: true, id: result.id, estimate });
}
