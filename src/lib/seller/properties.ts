import "server-only";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  getSupabaseProjectUrl,
  getSupabaseServiceRoleKey,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/env";
import { isMembershipStatusActive } from "@/lib/unlocks/membership";
import type {
  SellerPropertyInput,
  SellerPropertyRow,
  SellerPropertyStatus,
} from "@/lib/seller/property-types";

export type {
  SellerPropertyRow,
  SellerPropertyStatus,
  SellerPropertyInput,
} from "@/lib/seller/property-types";

function createServiceClient() {
  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapProperty(row: Record<string, unknown>): SellerPropertyRow {
  return {
    id: String(row.id),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    zip: String(row.zip ?? ""),
    price: row.price == null ? null : Number(row.price),
    bedrooms: row.bedrooms == null ? null : Number(row.bedrooms),
    bathrooms: row.bathrooms == null ? null : Number(row.bathrooms),
    squareFootage: row.square_footage == null ? null : Number(row.square_footage),
    description: row.description == null ? null : String(row.description),
    status: String(row.status ?? "draft") as SellerPropertyStatus,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function listMySellerProperties(): Promise<SellerPropertyRow[]> {
  if (!isSupabaseAuthConfigured()) return [];

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("seller_properties")
      .select(
        "id, address, city, state, zip, price, bedrooms, bathrooms, square_footage, description, status, created_at, updated_at",
      )
      .order("updated_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => mapProperty(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getMySellerProperty(id: string): Promise<SellerPropertyRow | null> {
  if (!isSupabaseAuthConfigured()) return null;

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("seller_properties")
      .select(
        "id, address, city, state, zip, price, bedrooms, bathrooms, square_footage, description, status, created_at, updated_at",
      )
      .eq("id", id.trim())
      .maybeSingle();

    if (error || !data) return null;
    return mapProperty(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function createSellerPropertyDraft(
  input: SellerPropertyInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isSupabaseAuthConfigured()) {
    return { ok: false, error: "Auth is not configured." };
  }

  const address = input.address.trim();
  const city = input.city.trim();
  const state = input.state.trim().toUpperCase();
  const zip = input.zip.trim();
  if (!address || !city || !state || !zip) {
    return { ok: false, error: "Address, city, state, and ZIP are required." };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { ok: false, error: "Sign in to list a property." };

    const hasSub = await userHasActiveSellerListingSubscription(userData.user.id);
    const status: SellerPropertyStatus = hasSub ? "active" : "pending_payment";

    const { data, error } = await supabase
      .from("seller_properties")
      .insert({
        user_id: userData.user.id,
        address,
        city,
        state,
        zip,
        price: input.price ?? null,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        square_footage: input.squareFootage ?? null,
        description: input.description?.trim() || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, error: "Could not save listing draft." };
  }
}

export type SellerListingSubscriptionRow = {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  updatedAt: string | null;
};

export async function getMySellerListingSubscription(): Promise<SellerListingSubscriptionRow | null> {
  if (!isSupabaseAuthConfigured()) return null;

  try {
    const supabase = await createSupabaseAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from("seller_listing_subscriptions")
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

export async function userHasActiveSellerListingSubscription(userId: string): Promise<boolean> {
  if (!isSupabaseAuthConfigured() || !userId) return false;

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "has_active_seller_listing_subscription",
    );
    if (!rpcError) return Boolean(rpcData);

    const { data, error } = await supabase
      .from("seller_listing_subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return false;
    return isMembershipStatusActive(data.status, data.current_period_end);
  } catch {
    return false;
  }
}

export async function upsertSellerListingSubscription(input: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const client = createServiceClient();
  if (!client) {
    return { ok: false, error: "Service role client is not configured." };
  }

  const { error } = await client.from("seller_listing_subscriptions").upsert(
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

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function activateSellerPropertyForUser(input: {
  userId: string;
  propertyId?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const client = createServiceClient();
  if (!client) {
    return { ok: false, error: "Service role client is not configured." };
  }

  const now = new Date().toISOString();

  if (input.propertyId?.trim()) {
    const { error } = await client
      .from("seller_properties")
      .update({ status: "active", updated_at: now })
      .eq("user_id", input.userId)
      .eq("id", input.propertyId.trim());

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { error } = await client
    .from("seller_properties")
    .update({ status: "active", updated_at: now })
    .eq("user_id", input.userId)
    .in("status", ["draft", "pending_payment"]);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deactivateSellerPropertiesForUser(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = createServiceClient();
  if (!client) {
    return { ok: false, error: "Service role client is not configured." };
  }

  const { error } = await client
    .from("seller_properties")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Resolve Stripe customer from buyer membership, seller sub, or unlocks. */
export async function resolveAnyStripeCustomerIdForUser(
  userId: string,
): Promise<string | null> {
  const client = createServiceClient();
  if (!client || !userId) return null;

  const seller = await client
    .from("seller_listing_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .maybeSingle();
  if (seller.data?.stripe_customer_id) return String(seller.data.stripe_customer_id);

  const buyer = await client
    .from("stripe_memberships")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .maybeSingle();
  if (buyer.data?.stripe_customer_id) return String(buyer.data.stripe_customer_id);

  const unlock = await client
    .from("listing_unlocks")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .order("unlocked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unlock.data?.stripe_customer_id ? String(unlock.data.stripe_customer_id) : null;
}
