import "server-only";

import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin/admin-allowlist";
import { FORCE_PAYWALL_COOKIE } from "@/lib/unlocks/paywall-bypass-cookie";

export { FORCE_PAYWALL_COOKIE };

/**
 * Master switch (Vercel / .env):
 * - unset / true  → admins auto-unlock listings (default)
 * - false / 0 / off → admin unlock bypass disabled site-wide
 */
export function isPaywallAdminBypassEnvEnabled(): boolean {
  const raw = process.env.PAYWALL_ADMIN_BYPASS?.trim().toLowerCase();
  if (!raw) return true;
  return !["0", "false", "off", "no"].includes(raw);
}

export async function isForcePaywallCookieActive(): Promise<boolean> {
  try {
    const jar = await cookies();
    return jar.get(FORCE_PAYWALL_COOKIE)?.value === "1";
  } catch {
    return false;
  }
}

/** True when this admin should skip the paywall (env on AND force-paywall cookie off). */
export async function shouldAdminBypassPaywall(
  email: string | null | undefined,
): Promise<boolean> {
  if (!isAdminEmail(email)) return false;
  if (!isPaywallAdminBypassEnvEnabled()) return false;
  if (await isForcePaywallCookieActive()) return false;
  return true;
}
