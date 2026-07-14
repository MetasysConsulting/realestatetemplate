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
