import type { User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import {
  auctionPropertyDetailPath,
  bankOwnedDetailPath,
  hudDetailPath,
  LISTING_ROUTE_PREFIX,
  PROPERTY_CATEGORIES,
  propertyRadarDetailPath,
  type PropertyCategoryKey,
} from "@/lib/property-categories";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  getSupabaseProjectUrl,
  getSupabaseServiceRoleKey,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/env";
import { userHasActiveMembership } from "@/lib/unlocks/membership";
import { shouldAdminBypassPaywall } from "@/lib/unlocks/paywall-bypass";

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

function createServiceClient() {
  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Normalize to `listings.id` (TEXT PK).
 * HUD rows are stored as `hud-{caseNumber}` — bare case numbers get the prefix.
 */
export function toListingUnlockId(listingId: string): string {
  const trimmed = listingId.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("hud-")) return trimmed;
  // Bare HUD case numbers: 061-123456 → hud-061-123456
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

/** Admin allowlist, active membership, or per-listing unlock. */
export async function resolveListingAccess(
  user: User | null | undefined,
  listingId: string,
): Promise<ListingAccessResult> {
  const isAdminBypass = await shouldAdminBypassPaywall(user?.email);
  if (isAdminBypass) {
    return {
      unlocked: true,
      isAdminBypass: true,
      hasUnlock: false,
      userId: user?.id ?? null,
    };
  }

  if (!user?.id) {
    return {
      unlocked: false,
      isAdminBypass: false,
      hasUnlock: false,
      userId: null,
    };
  }

  const hasMembership = await userHasActiveMembership(user.id);
  if (hasMembership) {
    return {
      unlocked: true,
      isAdminBypass: false,
      hasUnlock: true,
      userId: user.id,
    };
  }

  if (!listingId) {
    return {
      unlocked: false,
      isAdminBypass: false,
      hasUnlock: false,
      userId: user.id,
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

export type MyListingUnlockRow = {
  listingId: string;
  unlockedAt: string;
  source: string;
  detailPath: string;
  label: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  category: string | null;
  categoryLabel: string | null;
  priceLabel: string | null;
  imageUrl: string | null;
};

/** List active unlocks for the signed-in user (My Unlocks UI). */
export async function listMyListingUnlocks(): Promise<MyListingUnlockRow[]> {
  if (!isSupabaseAuthConfigured()) return [];

  try {
    const supabase = await createSupabaseAuthServerClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("listing_unlocks")
      .select(
        "listing_id, unlocked_at, source, listings ( id, category, external_id, address, city, state, zip, price, price_label, image_url )",
      )
      .is("revoked_at", null)
      .or(`expires_at.is.null,expires_at.gt."${nowIso}"`)
      .order("unlocked_at", { ascending: false });

    if (error || !data) {
      // Join may fail if migration/relationship missing — fall back to id-only rows.
      const fallback = await supabase
        .from("listing_unlocks")
        .select("listing_id, unlocked_at, source")
        .is("revoked_at", null)
        .or(`expires_at.is.null,expires_at.gt."${nowIso}"`)
        .order("unlocked_at", { ascending: false });

      if (fallback.error || !fallback.data) return [];

      return fallback.data.map((row) => {
        const listingId = String(row.listing_id);
        return {
          listingId,
          unlockedAt: String(row.unlocked_at),
          source: String(row.source),
          detailPath: detailPathForListingId(listingId),
          label: listingId,
          address: null,
          city: null,
          state: null,
          zip: null,
          category: null,
          categoryLabel: null,
          priceLabel: null,
          imageUrl: null,
        };
      });
    }

    return data.map((row) => {
      const listingId = String(row.listing_id);
      const listing = normalizeJoinedListing(row.listings);
      const detailPath = detailPathForListingId(
        listingId,
        listing?.category,
        listing?.external_id,
      );
      const label = listingLabel(listingId, listing);
      return {
        listingId,
        unlockedAt: String(row.unlocked_at),
        source: String(row.source),
        detailPath,
        label,
        address: listing?.address?.trim() || null,
        city: listing?.city?.trim() || null,
        state: listing?.state?.trim() || null,
        zip: listing?.zip?.trim() || null,
        category: listing?.category?.trim() || null,
        categoryLabel: categoryNavLabel(listing?.category),
        priceLabel: listingPriceLabel(listing),
        imageUrl: listing?.image_url?.trim() || null,
      };
    });
  } catch {
    return [];
  }
}

type JoinedListing = {
  id?: string;
  category?: string;
  external_id?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  price?: number | null;
  price_label?: string | null;
  image_url?: string | null;
};

function normalizeJoinedListing(value: unknown): JoinedListing | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return (value[0] as JoinedListing | undefined) ?? null;
  }
  return value as JoinedListing;
}

function listingLabel(listingId: string, listing: JoinedListing | null): string {
  if (!listing) return listingId;
  const street = listing.address?.trim();
  const cityState = [listing.city, listing.state].filter(Boolean).join(", ");
  if (street && cityState) return `${street}, ${cityState}`;
  if (street) return street;
  if (cityState) return cityState;
  return listingId;
}

function categoryNavLabel(category: string | null | undefined): string | null {
  if (!category) return null;
  const config = PROPERTY_CATEGORIES[category as PropertyCategoryKey];
  return config?.navLabel ?? category.replace(/-/g, " ");
}

function listingPriceLabel(listing: JoinedListing | null): string | null {
  if (!listing) return null;
  const labeled = listing.price_label?.trim();
  if (labeled) return labeled;
  if (typeof listing.price === "number" && Number.isFinite(listing.price) && listing.price > 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(listing.price);
  }
  return null;
}

/** Resolve public detail URL from listings.id (+ optional category/external_id). */
export function detailPathForListingId(
  listingId: string,
  category?: string | null,
  externalId?: string | null,
): string {
  const id = toListingUnlockId(listingId);
  const categoryKey = category as PropertyCategoryKey | undefined;

  if (id.startsWith("hud-") || categoryKey === "hud-home") {
    const caseNumber = externalId?.trim() || id.replace(/^hud-/, "");
    return hudDetailPath(caseNumber);
  }

  if (categoryKey === "bank-owned" || id.startsWith("vrm-") || id.startsWith("homesteps-")) {
    return bankOwnedDetailPath(id);
  }

  if (
    categoryKey === "auction-property" ||
    id.startsWith("gsa-") ||
    id.startsWith("gsa-sale-")
  ) {
    return auctionPropertyDetailPath(id);
  }

  if (id.startsWith("seller-")) {
    return propertyRadarDetailPath("off-market", id);
  }

  if (
    categoryKey === "motivated-seller" ||
    categoryKey === "off-market" ||
    categoryKey === "foreclosure" ||
    categoryKey === "pre-foreclosure"
  ) {
    return propertyRadarDetailPath(categoryKey, id);
  }

  if (categoryKey === "sheriffs-sale" || categoryKey === "tax-delinquent") {
    return `${LISTING_ROUTE_PREFIX}/${categoryKey}/${encodeURIComponent(id)}`;
  }

  return bankOwnedDetailPath(id);
}
