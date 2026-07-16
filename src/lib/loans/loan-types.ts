/** Shared types for Find a Loan wizard + lead storage. */

export const LOAN_PURPOSE_OPTIONS = [
  { id: "fix-flip", label: "Fix & Flip", description: "Buy, rehab, and resell" },
  { id: "rental", label: "Rental / Buy & Hold", description: "Long-term investment property" },
  { id: "construction", label: "New Construction", description: "Ground-up or major build" },
  { id: "commercial", label: "Commercial", description: "Office, retail, industrial, mixed-use" },
  { id: "bridge", label: "Bridge Loan", description: "Short-term gap financing" },
  { id: "auction", label: "Auction / Foreclosure", description: "Fast close for auction purchases" },
] as const;

export type LoanPurposeId = (typeof LOAN_PURPOSE_OPTIONS)[number]["id"];

export const CREDIT_BAND_OPTIONS = [
  { id: "excellent", label: "Excellent (740+)" },
  { id: "good", label: "Good (680–739)" },
  { id: "fair", label: "Fair (620–679)" },
  { id: "poor", label: "Below 620 / rebuilding" },
] as const;

export type CreditBandId = (typeof CREDIT_BAND_OPTIONS)[number]["id"];

export const EXPERIENCE_OPTIONS = [
  { id: "none", label: "First investment deal" },
  { id: "some", label: "1–3 deals closed" },
  { id: "experienced", label: "4+ deals closed" },
] as const;

export type ExperienceId = (typeof EXPERIENCE_OPTIONS)[number]["id"];

export const TIMELINE_OPTIONS = [
  { id: "asap", label: "ASAP (under 2 weeks)" },
  { id: "30", label: "Within 30 days" },
  { id: "60", label: "30–60 days" },
  { id: "exploring", label: "Just exploring" },
] as const;

export type TimelineId = (typeof TIMELINE_OPTIONS)[number]["id"];

export const PROPERTY_TYPE_OPTIONS = [
  { id: "sfr", label: "Single-family" },
  { id: "multi", label: "2–4 unit" },
  { id: "mf5", label: "5+ unit multifamily" },
  { id: "condo", label: "Condo / townhome" },
  { id: "commercial", label: "Commercial" },
  { id: "land", label: "Land / lot" },
] as const;

export type PropertyTypeId = (typeof PROPERTY_TYPE_OPTIONS)[number]["id"];

export const LOAN_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "assigned",
  "closed_won",
  "closed_lost",
] as const;

export type LoanLeadStatus = (typeof LOAN_LEAD_STATUSES)[number];

export function isLoanPurposeId(value: string): value is LoanPurposeId {
  return LOAN_PURPOSE_OPTIONS.some((o) => o.id === value);
}

export function isLoanLeadStatus(value: string): value is LoanLeadStatus {
  return (LOAN_LEAD_STATUSES as readonly string[]).includes(value);
}
