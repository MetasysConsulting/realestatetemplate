import { isAdminEmail } from "@/lib/admin/admin-allowlist";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { userHasActiveMembership } from "@/lib/unlocks/membership";

/** Admins and active unlimited members see full browse cards. */
export async function shouldRevealBrowseDetails(): Promise<boolean> {
  const user = await getAuthUser();
  if (isAdminEmail(user?.email)) return true;
  if (!user?.id) return false;
  return userHasActiveMembership(user.id);
}
