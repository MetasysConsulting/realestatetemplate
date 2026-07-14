import { NextResponse, type NextRequest } from "next/server";
import { isStripeConfigured } from "@/lib/stripe/config";
import { fulfillCheckoutSessionForUser } from "@/lib/stripe/fulfill-checkout";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { toListingUnlockId } from "@/lib/unlocks/entitlements";

/**
 * Confirm a paid Checkout session and grant unlock/membership.
 * - Prefer signed-in user.
 * - With a Stripe `session_id` from the success URL, anonymous callers can still fulfill
 *   (session id is unguessable and Stripe payment is re-verified server-side).
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const user = await getAuthUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as { sessionId?: unknown; listingId?: unknown };
  const sessionId =
    typeof payload.sessionId === "string" ? payload.sessionId.trim() : "";
  const listingId =
    typeof payload.listingId === "string" ? toListingUnlockId(payload.listingId) : "";

  if (!sessionId && !user) {
    return NextResponse.json(
      {
        error: "Sign in required, or open your checkout success link with session_id.",
        loginRequired: true,
      },
      { status: 401 },
    );
  }

  if (!sessionId && !listingId) {
    return NextResponse.json(
      { error: "sessionId or listingId is required." },
      { status: 400 },
    );
  }

  try {
    const result = await fulfillCheckoutSessionForUser({
      userId: user?.id ?? null,
      sessionId: sessionId || null,
      listingId: listingId || null,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          unlocked: false,
          needsLogin: result.needsLogin || !user,
          error: result.error,
          sessionId: result.sessionId,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      unlocked: true,
      needsLogin: Boolean(result.needsLogin) || !user,
      sessionId: result.sessionId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Confirm failed.";
    console.error("[stripe/confirm]", message);
    return NextResponse.json({ error: message, unlocked: false }, { status: 500 });
  }
}
