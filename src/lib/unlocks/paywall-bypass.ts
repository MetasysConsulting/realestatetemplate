import "server-only";

import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin/admin-allowlist";
import { FORCE_PAYWALL_COOKIE } from "@/lib/unlocks/paywall-bypass-cookie";

export { FORCE_PAYWALL_COOKIE };

/**
 * Master switch (Vercel / .env):
 * - unset / false → admins see the paywall like members (default — better for QA)
 * - true / 1 / on → admins auto-unlock all listings
 *
 * Quick test without redeploying:
 * - `?forcePaywall=1` → treat admin as locked (cookie)
 * - `?forcePaywall=0` → clear that cookie
 */
export function isPaywallAdminBypassEnvEnabled(): boolean {
  const raw = process.env.PAYWALL_ADMIN_BYPASS?.trim().toLowerCase();
  if (!raw) return false;
  return ["1", "true", "on", "yes"].includes(raw);
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
