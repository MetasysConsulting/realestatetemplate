import { getAuthUser } from "@/lib/supabase/auth-server";
import { userHasActiveMembership } from "@/lib/unlocks/membership";
import { shouldAdminBypassPaywall } from "@/lib/unlocks/paywall-bypass";

/** Admins (when bypass is on) and active unlimited members see full browse cards. */
export async function shouldRevealBrowseDetails(): Promise<boolean> {
  const user = await getAuthUser();
  if (await shouldAdminBypassPaywall(user?.email)) return true;
  if (!user?.id) return false;
  return userHasActiveMembership(user.id);
}
