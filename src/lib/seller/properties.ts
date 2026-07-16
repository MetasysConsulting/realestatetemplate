import "server-only";

import pg from "pg";
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
import {
  deactivatePublicListingForSellerProperty,
  deactivatePublicListingsForSellerUser,
  syncPublicListingForSellerPropertyId,
} from "@/lib/seller/sync-public-listing";

export type {
  SellerPropertyRow,
  SellerPropertyStatus,
  SellerPropertyInput,
} from "@/lib/seller/property-types";

const { Client } = pg;

function createServiceClient() {
  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRoleKey()?.trim();
  if (!url || !key || key.length < 20) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function withPg<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("Neither a valid service role key nor DATABASE_URL is configured.");
  }
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => {});
  }
}

function mapProperty(row: Record<string, unknown>): SellerPropertyRow {
  const images = Array.isArray(row.image_urls)
    ? row.image_urls.map((u) => String(u)).filter(Boolean)
    : [];
  return {
    id: String(row.id),
    title: row.title == null ? null : String(row.title),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    zip: String(row.zip ?? ""),
    county: row.county == null ? null : String(row.county),
    price: row.price == null ? null : Number(row.price),
    bedrooms: row.bedrooms == null ? null : Number(row.bedrooms),
    bathrooms: row.bathrooms == null ? null : Number(row.bathrooms),
    squareFootage: row.square_footage == null ? null : Number(row.square_footage),
    lotSize: row.lot_size == null ? null : Number(row.lot_size),
    yearBuilt: row.year_built == null ? null : Number(row.year_built),
    garage: row.garage == null ? null : Number(row.garage),
    propertyType: row.property_type == null ? null : String(row.property_type),
    listingStatus: row.listing_status == null ? null : String(row.listing_status),
    description: row.description == null ? null : String(row.description),
    videoUrl: row.video_url == null ? null : String(row.video_url),
    virtualTourUrl: row.virtual_tour_url == null ? null : String(row.virtual_tour_url),
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    imageUrls: images,
    status: String(row.status ?? "draft") as SellerPropertyStatus,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

const SELLER_PROPERTY_SELECT =
  "id, title, address, city, state, zip, county, price, bedrooms, bathrooms, square_footage, lot_size, year_built, garage, property_type, listing_status, description, video_url, virtual_tour_url, lat, lng, image_urls, status, created_at, updated_at";

export async function listMySellerProperties(): Promise<SellerPropertyRow[]> {
  if (!isSupabaseAuthConfigured()) return [];

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("seller_properties")
      .select(SELLER_PROPERTY_SELECT)
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
      .select(SELLER_PROPERTY_SELECT)
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
): Promise<{ ok: boolean; id?: string; status?: SellerPropertyStatus; error?: string }> {
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

  const imageUrls = (input.imageUrls ?? [])
    .map((u) => String(u).trim())
    .filter((u) => u.startsWith("https://") || u.startsWith("http://"))
    .slice(0, 12);

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
        title: input.title?.trim() || null,
        address,
        city,
        state,
        zip,
        county: input.county?.trim() || null,
        price: input.price ?? null,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        square_footage: input.squareFootage ?? null,
        lot_size: input.lotSize ?? null,
        year_built: input.yearBuilt ?? null,
        garage: input.garage ?? null,
        property_type: input.propertyType?.trim() || null,
        listing_status: input.listingStatus?.trim() || null,
        description: input.description?.trim() || null,
        video_url: input.videoUrl?.trim() || null,
        virtual_tour_url: input.virtualTourUrl?.trim() || null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        image_urls: imageUrls,
        status,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    const id = String(data.id);
    if (status === "active") {
      const sync = await syncPublicListingForSellerPropertyId({
        userId: userData.user.id,
        propertyId: id,
        isActive: true,
      });
      if (!sync.ok) {
        console.error("[seller] public sync failed after draft", sync.error);
        // Keep the private row, but do not claim it is live/public.
        await supabase
          .from("seller_properties")
          .update({ status: "pending_payment", updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userData.user.id);
        return {
          ok: false,
          error: `Saved, but could not publish publicly: ${sync.error}`,
        };
      }
    }
    return { ok: true, id, status };
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
  if (client) {
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
    if (!error) return { ok: true };
    console.error("[seller] subscription upsert failed, trying DATABASE_URL", error.message);
  }

  try {
    await withPg(async (pgClient) => {
      await pgClient.query(
        `
        INSERT INTO seller_listing_subscriptions (
          user_id, stripe_customer_id, stripe_subscription_id, status,
          current_period_end, cancel_at_period_end, metadata, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, seller_listing_subscriptions.stripe_customer_id),
          stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, seller_listing_subscriptions.stripe_subscription_id),
          status = EXCLUDED.status,
          current_period_end = EXCLUDED.current_period_end,
          cancel_at_period_end = EXCLUDED.cancel_at_period_end,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        `,
        [
          input.userId,
          input.stripeCustomerId ?? null,
          input.stripeSubscriptionId ?? null,
          input.status,
          input.currentPeriodEnd ?? null,
          input.cancelAtPeriodEnd ?? false,
          JSON.stringify(input.metadata ?? {}),
        ],
      );
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Subscription upsert failed." };
  }
}

export async function activateSellerPropertyForUser(input: {
  userId: string;
  propertyId?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const client = createServiceClient();

  if (input.propertyId?.trim()) {
    const propertyId = input.propertyId.trim();
    if (client) {
      const { error } = await client
        .from("seller_properties")
        .update({ status: "active", updated_at: now })
        .eq("user_id", input.userId)
        .eq("id", propertyId);
      if (error) {
        console.error("[seller] activate failed, trying DATABASE_URL", error.message);
      } else {
        const sync = await syncPublicListingForSellerPropertyId({
          userId: input.userId,
          propertyId,
          isActive: true,
        });
        if (!sync.ok) {
          await client
            .from("seller_properties")
            .update({ status: "pending_payment", updated_at: new Date().toISOString() })
            .eq("user_id", input.userId)
            .eq("id", propertyId);
          return { ok: false, error: sync.error };
        }
        return { ok: true };
      }
    }

    try {
      await withPg(async (pgClient) => {
        await pgClient.query(
          `UPDATE seller_properties SET status = 'active', updated_at = $3
           WHERE user_id = $1 AND id = $2`,
          [input.userId, propertyId, now],
        );
      });
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Activate failed." };
    }

    const sync = await syncPublicListingForSellerPropertyId({
      userId: input.userId,
      propertyId,
      isActive: true,
    });
    if (!sync.ok) {
      try {
        await withPg(async (pgClient) => {
          await pgClient.query(
            `UPDATE seller_properties SET status = 'pending_payment', updated_at = NOW()
             WHERE user_id = $1 AND id = $2`,
            [input.userId, propertyId],
          );
        });
      } catch {
        /* ignore rollback failure */
      }
      return { ok: false, error: sync.error };
    }
    return { ok: true };
  }

  let pendingIds: string[] = [];

  if (client) {
    const { data: pending, error: listError } = await client
      .from("seller_properties")
      .select("id")
      .eq("user_id", input.userId)
      .in("status", ["draft", "pending_payment", "inactive"]);

    if (!listError) {
      pendingIds = (pending ?? []).map((row) => String(row.id));
      const { error } = await client
        .from("seller_properties")
        .update({ status: "active", updated_at: now })
        .eq("user_id", input.userId)
        .in("status", ["draft", "pending_payment", "inactive"]);
      if (!error) {
        for (const id of pendingIds) {
          const sync = await syncPublicListingForSellerPropertyId({
            userId: input.userId,
            propertyId: id,
            isActive: true,
          });
          if (!sync.ok) {
            console.error("[seller] bulk public sync failed", id, sync.error);
          }
        }
        return { ok: true };
      }
      console.error("[seller] bulk activate failed, trying DATABASE_URL", error.message);
    }
  }

  try {
    pendingIds = await withPg(async (pgClient) => {
      const pending = await pgClient.query<{ id: string }>(
        `SELECT id FROM seller_properties
         WHERE user_id = $1 AND status = ANY($2::text[])`,
        [input.userId, ["draft", "pending_payment", "inactive"]],
      );
      await pgClient.query(
        `UPDATE seller_properties SET status = 'active', updated_at = $2
         WHERE user_id = $1 AND status = ANY($3::text[])`,
        [input.userId, now, ["draft", "pending_payment", "inactive"]],
      );
      return pending.rows.map((r) => String(r.id));
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bulk activate failed." };
  }

  for (const id of pendingIds) {
    const sync = await syncPublicListingForSellerPropertyId({
      userId: input.userId,
      propertyId: id,
      isActive: true,
    });
    if (!sync.ok) {
      console.error("[seller] bulk public sync failed", id, sync.error);
    }
  }

  return { ok: true };
}

export async function deactivateSellerPropertiesForUser(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = createServiceClient();
  let activeIds: string[] = [];

  if (client) {
    const { data: activeRows } = await client
      .from("seller_properties")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active");
    activeIds = (activeRows ?? []).map((row) => String(row.id));

    const { error } = await client
      .from("seller_properties")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "active");

    if (!error) {
      const publicSync = await deactivatePublicListingsForSellerUser(userId);
      if (!publicSync.ok) {
        for (const id of activeIds) {
          await deactivatePublicListingForSellerProperty(id);
        }
      }
      return { ok: true };
    }
    console.error("[seller] deactivate failed, trying DATABASE_URL", error.message);
  }

  try {
    activeIds = await withPg(async (pgClient) => {
      const active = await pgClient.query<{ id: string }>(
        `SELECT id FROM seller_properties WHERE user_id = $1 AND status = 'active'`,
        [userId],
      );
      await pgClient.query(
        `UPDATE seller_properties SET status = 'inactive', updated_at = NOW()
         WHERE user_id = $1 AND status = 'active'`,
        [userId],
      );
      return active.rows.map((r) => String(r.id));
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Deactivate failed." };
  }

  const publicSync = await deactivatePublicListingsForSellerUser(userId);
  if (!publicSync.ok) {
    for (const id of activeIds) {
      await deactivatePublicListingForSellerProperty(id);
    }
  }

  return { ok: true };
}

/**
 * Reactivate a pending/inactive listing when the user already has an active $49 sub.
 * No Stripe checkout — publishes to public inventory immediately.
 */
export async function activateSellerPropertyWithExistingSub(input: {
  userId: string;
  propertyId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const hasSub = await userHasActiveSellerListingSubscription(input.userId);
  if (!hasSub) {
    return { ok: false, error: "An active $49/month seller subscription is required." };
  }

  return activateSellerPropertyForUser({
    userId: input.userId,
    propertyId: input.propertyId,
  });
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
