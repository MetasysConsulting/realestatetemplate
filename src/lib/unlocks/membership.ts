import "server-only";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  getSupabaseProjectUrl,
  getSupabaseServiceRoleKey,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/env";

function createServiceClient() {
  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function isMembershipStatusActive(
  status: string | null | undefined,
  currentPeriodEnd?: string | null,
): boolean {
  if (!status || !ACTIVE_STATUSES.has(status)) return false;
  if (!currentPeriodEnd) return true;
  return new Date(currentPeriodEnd).getTime() > Date.now();
}

export type StripeMembershipRow = {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  updatedAt: string | null;
};

export async function getMyStripeMembership(): Promise<StripeMembershipRow | null> {
  if (!isSupabaseAuthConfigured()) return null;

  try {
    const supabase = await createSupabaseAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from("stripe_memberships")
      .select(
        "status, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, updated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      status: String(data.status ?? "inactive"),
      currentPeriodEnd: data.current_period_end ? String(data.current_period_end) : null,
      cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
      stripeCustomerId: data.stripe_customer_id ? String(data.stripe_customer_id) : null,
      stripeSubscriptionId: data.stripe_subscription_id
        ? String(data.stripe_subscription_id)
        : null,
      updatedAt: data.updated_at ? String(data.updated_at) : null,
    };
  } catch {
    return null;
  }
}

/** Prefer membership customer, else any unlock row that stored a Stripe customer id. */
export async function resolveStripeCustomerIdForUser(
  userId: string,
): Promise<string | null> {
  const membership = await getMyStripeMembership();
  if (membership?.stripeCustomerId) return membership.stripeCustomerId;

  const service = createServiceClient();
  if (!service || !userId) return null;

  const { data } = await service
    .from("listing_unlocks")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .order("unlocked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.stripe_customer_id ? String(data.stripe_customer_id) : null;
}

export async function userHasActiveMembership(userId: string): Promise<boolean> {
  if (!isSupabaseAuthConfigured() || !userId) return false;

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data: rpcData, error: rpcError } = await supabase.rpc("has_active_membership");
    if (!rpcError) {
      return Boolean(rpcData);
    }

    const { data, error } = await supabase
      .from("stripe_memberships")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return false;
    return isMembershipStatusActive(data.status, data.current_period_end);
  } catch {
    return false;
  }
}

export type UpsertMembershipInput = {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, unknown>;
};

export async function upsertStripeMembership(
  input: UpsertMembershipInput,
): Promise<{ ok: boolean; error?: string }> {
  const client = createServiceClient();
  if (!client) {
    return { ok: false, error: "Service role client is not configured." };
  }

  const { error } = await client.from("stripe_memberships").upsert(
    {
      user_id: input.userId,
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      status: input.status,
      current_period_end: input.currentPeriodEnd ?? null,
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
      metadata: input.metadata ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
