import type { User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin/admin-allowlist";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseAuthConfigured } from "@/lib/supabase/env";

export type ListingUnlockSource =
  | "stripe_one_time"
  | "stripe_subscription"
  | "admin_grant"
  | "promo";

export type ListingAccessResult = {
  unlocked: boolean;
  isAdminBypass: boolean;
  hasUnlock: boolean;
  userId: string | null;
};

function getServiceKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY
  );
}

function createServiceClient() {
  const url = getSupabaseUrl();
  const key = getServiceKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Normalize HUD case numbers to listings.id when needed. */
export function toListingUnlockId(listingId: string): string {
  const trimmed = listingId.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("hud-") || trimmed.includes("-")) return trimmed;
  // Bare HUD case numbers sometimes appear without prefix.
  if (/^\d{3}-\d+$/.test(trimmed)) return `hud-${trimmed}`;
  return trimmed;
}

/**
 * True when the signed-in user has an active unlock row for this listing.
 * Uses the user session + RLS (or has_listing_unlock RPC).
 */
export async function userHasListingUnlock(
  userId: string,
  listingId: string,
): Promise<boolean> {
  if (!isSupabaseAuthConfigured() || !userId || !listingId) return false;

  const id = toListingUnlockId(listingId);

  try {
    const supabase = await createSupabaseAuthServerClient();

    const { data: rpcData, error: rpcError } = await supabase.rpc("has_listing_unlock", {
      p_listing_id: id,
    });

    if (!rpcError) {
      return Boolean(rpcData);
    }

    // Fallback if RPC not migrated yet: direct table read under RLS.
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("listing_unlocks")
      .select("id")
      .eq("user_id", userId)
      .eq("listing_id", id)
      .is("revoked_at", null)
      .or(`expires_at.is.null,expires_at.gt."${nowIso}"`)
      .limit(1)
      .maybeSingle();

    if (error) {
      // Table missing / not migrated — treat as locked, never throw into the page.
      return false;
    }

    return Boolean(data?.id);
  } catch {
    return false;
  }
}

/** Admin allowlist OR active listing unlock. */
export async function resolveListingAccess(
  user: User | null | undefined,
  listingId: string,
): Promise<ListingAccessResult> {
  const isAdminBypass = isAdminEmail(user?.email);
  if (isAdminBypass) {
    return {
      unlocked: true,
      isAdminBypass: true,
      hasUnlock: false,
      userId: user?.id ?? null,
    };
  }

  if (!user?.id || !listingId) {
    return {
      unlocked: false,
      isAdminBypass: false,
      hasUnlock: false,
      userId: user?.id ?? null,
    };
  }

  const hasUnlock = await userHasListingUnlock(user.id, listingId);
  return {
    unlocked: hasUnlock,
    isAdminBypass: false,
    hasUnlock,
    userId: user.id,
  };
}

export type GrantListingUnlockInput = {
  userId: string;
  listingId: string;
  source?: ListingUnlockSource;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  amountCents?: number | null;
  currency?: string;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Service-role upsert for Stripe webhooks / admin grants.
 * Safe to call repeatedly for the same checkout session.
 */
export async function grantListingUnlock(
  input: GrantListingUnlockInput,
): Promise<{ ok: boolean; error?: string }> {
  const client = createServiceClient();
  if (!client) {
    return { ok: false, error: "Service role client is not configured." };
  }

  const listingId = toListingUnlockId(input.listingId);
  const row = {
    user_id: input.userId,
    listing_id: listingId,
    source: input.source ?? "stripe_one_time",
    stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
    stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    stripe_customer_id: input.stripeCustomerId ?? null,
    amount_cents: input.amountCents ?? null,
    currency: input.currency ?? "usd",
    expires_at: input.expiresAt ?? null,
    revoked_at: null,
    metadata: input.metadata ?? {},
    unlocked_at: new Date().toISOString(),
  };

  const { error } = await client.from("listing_unlocks").upsert(row, {
    onConflict: "user_id,listing_id",
    ignoreDuplicates: false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** List active unlocks for the signed-in user (My Unlocks UI). */
export async function listMyListingUnlocks(): Promise<
  Array<{ listingId: string; unlockedAt: string; source: string }>
> {
  if (!isSupabaseAuthConfigured()) return [];

  try {
    const supabase = await createSupabaseAuthServerClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("listing_unlocks")
      .select("listing_id, unlocked_at, source")
      .is("revoked_at", null)
      .or(`expires_at.is.null,expires_at.gt."${nowIso}"`)
      .order("unlocked_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      listingId: String(row.listing_id),
      unlockedAt: String(row.unlocked_at),
      source: String(row.source),
    }));
  } catch {
    return [];
  }
}
