import { NextResponse, type NextRequest } from "next/server";
import { isStripeConfigured } from "@/lib/stripe/config";
import { createListingCheckoutSession } from "@/lib/stripe/checkout";
import type { StripeCheckoutPlan } from "@/lib/stripe/types";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { toListingUnlockId } from "@/lib/unlocks/entitlements";

function isPlan(value: unknown): value is StripeCheckoutPlan {
  return value === "unlock" || value === "unlimited";
}

function safeReturnPath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet." },
      { status: 503 },
    );
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      {
        error: "Create a free account or sign in before purchasing.",
        loginRequired: true,
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as {
    listingId?: unknown;
    plan?: unknown;
    returnPath?: unknown;
  };

  const listingId =
    typeof payload.listingId === "string" ? toListingUnlockId(payload.listingId) : "";
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  }

  if (!isPlan(payload.plan)) {
    return NextResponse.json(
      { error: 'plan must be "unlock" or "unlimited".' },
      { status: 400 },
    );
  }

  const returnPath = safeReturnPath(payload.returnPath);
  const origin = request.nextUrl.origin;
  // `{CHECKOUT_SESSION_ID}` is replaced by Stripe so we can fulfill unlocks if the webhook lags.
  const successUrl = `${origin}${returnPath}?checkout=success&plan=${payload.plan}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}${returnPath}?checkout=cancelled`;

  try {
    const session = await createListingCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      listingId,
      plan: payload.plan,
      successUrl,
      cancelUrl,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    console.error("[stripe/checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
