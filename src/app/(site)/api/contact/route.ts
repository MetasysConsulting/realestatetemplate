import { NextResponse, type NextRequest } from "next/server";
import { getBrevoConfig, sendBrevoEmail } from "@/lib/email/brevo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 6;
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

function str(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const config = getBrevoConfig();
  if (!config) {
    return NextResponse.json(
      {
        error:
          "Contact email is almost ready — waiting on the verified Brevo sender address. Please try again soon.",
      },
      { status: 503 },
    );
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

  const name = str(body.name, 120);
  const email = str(body.email, 254).toLowerCase();
  const phone = str(body.phone, 40);
  const interest = str(body.interest, 80);
  const message = str(body.message, 4000);

  if (!name || !isEmail(email) || !message) {
    return NextResponse.json(
      { error: "Please enter your name, a valid email, and a message." },
      { status: 400 },
    );
  }

  const text = [
    `New contact form submission from reovana.com`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "—"}`,
    `Interest: ${interest || "—"}`,
    ``,
    `Message:`,
    message,
  ].join("\n");

  const html = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone || "—")}</p>
    <p><strong>Interest:</strong> ${escapeHtml(interest || "—")}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replaceAll("\n", "<br/>")}</p>
  `;

  const result = await sendBrevoEmail({
    toEmail: config.notifyEmail,
    toName: "REOVANA",
    subject: `REOVANA contact: ${name}`,
    textContent: text,
    htmlContent: html,
    replyToEmail: email,
    replyToName: name,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
