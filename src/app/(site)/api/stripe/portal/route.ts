import { NextResponse, type NextRequest } from "next/server";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { resolveStripeCustomerIdForUser } from "@/lib/unlocks/membership";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to manage billing.", loginRequired: true },
      { status: 401 },
    );
  }

  const customerId = await resolveStripeCustomerIdForUser(user.id);
  if (!customerId) {
    return NextResponse.json(
      {
        error:
          "No Stripe customer is linked to this account yet. Subscribe or unlock a listing first.",
      },
      { status: 409 },
    );
  }

  const returnUrl = `${request.nextUrl.origin}/billing`;

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a billing portal URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open billing portal.";
    console.error("[stripe/portal]", message);

    const portalNotConfigured =
      /customer portal|billing portal|no configuration|portal setting/i.test(message);
    return NextResponse.json(
      {
        error: portalNotConfigured
          ? "Stripe Customer Portal is not enabled yet. In Stripe Dashboard (Test mode): Settings → Billing → Customer portal → Activate."
          : message,
      },
      { status: 500 },
    );
  }
}
