import { isAdminEmail } from "@/lib/admin/admin-allowlist";
import { getAuthUser } from "@/lib/supabase/auth-server";

/** Admins see full browse cards; everyone else gets soft-gated teasers. Server-only. */
export async function shouldRevealBrowseDetails(): Promise<boolean> {
  const user = await getAuthUser();
  return isAdminEmail(user?.email);
}
