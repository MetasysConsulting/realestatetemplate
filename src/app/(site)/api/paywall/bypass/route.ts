import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin/admin-allowlist";
import { getAuthUser } from "@/lib/supabase/auth-server";

/** Client-safe check: signed-in allowlisted admins bypass listing paywalls. */
export async function GET() {
  const user = await getAuthUser();
  return NextResponse.json({
    bypass: isAdminEmail(user?.email),
  });
}
