import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { resolveListingAccess } from "@/lib/unlocks/entitlements";

/**
 * Client-safe paywall access check.
 * - bypass: allowlisted admin
 * - unlocked: admin OR active listing_unlocks row
 * Optional ?listingId= for entitlement lookup.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  const listingId = request.nextUrl.searchParams.get("listingId")?.trim() || "";

  if (!listingId) {
    const access = await resolveListingAccess(user, "");
    return NextResponse.json({
      signedIn: Boolean(user),
      bypass: access.isAdminBypass,
      unlocked: access.isAdminBypass,
      hasUnlock: false,
    });
  }

  const access = await resolveListingAccess(user, listingId);
  return NextResponse.json({
    signedIn: Boolean(user),
    bypass: access.isAdminBypass,
    unlocked: access.unlocked,
    hasUnlock: access.hasUnlock,
  });
}
