import { NextResponse, type NextRequest } from "next/server";
import { isStripeConfigured } from "@/lib/stripe/config";
import {
  createListingCheckoutSession,
  createSellerListingCheckoutSession,
} from "@/lib/stripe/checkout";
import type { StripeCheckoutPlan } from "@/lib/stripe/types";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { getMySellerProperty } from "@/lib/seller/properties";
import { toListingUnlockId } from "@/lib/unlocks/entitlements";

function isPlan(value: unknown): value is StripeCheckoutPlan {
  return value === "unlock" || value === "unlimited" || value === "seller_listing";
}

function safeReturnPath(raw: unknown, fallback: string): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
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
    propertyId?: unknown;
    plan?: unknown;
    returnPath?: unknown;
  };

  if (!isPlan(payload.plan)) {
    return NextResponse.json(
      { error: 'plan must be "unlock", "unlimited", or "seller_listing".' },
      { status: 400 },
    );
  }

  const origin = request.nextUrl.origin;

  try {
    if (payload.plan === "seller_listing") {
      const propertyId =
        typeof payload.propertyId === "string" ? payload.propertyId.trim() : "";
      if (!propertyId) {
        return NextResponse.json({ error: "propertyId is required." }, { status: 400 });
      }

      const property = await getMySellerProperty(propertyId);
      if (!property) {
        return NextResponse.json({ error: "Property not found." }, { status: 404 });
      }

      const returnPath = safeReturnPath(payload.returnPath, "/my-property");
      const successUrl = `${origin}${returnPath}?checkout=success&plan=seller_listing&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}${returnPath}?checkout=cancelled`;

      const session = await createSellerListingCheckoutSession({
        userId: user.id,
        userEmail: user.email,
        propertyId,
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
    }

    const listingId =
      typeof payload.listingId === "string" ? toListingUnlockId(payload.listingId) : "";
    if (!listingId) {
      return NextResponse.json({ error: "listingId is required." }, { status: 400 });
    }

    const returnPath = safeReturnPath(payload.returnPath, "/");
    const successUrl = `${origin}${returnPath}?checkout=success&plan=${payload.plan}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}${returnPath}?checkout=cancelled`;

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
