import { mapFavoriteRow, type MemberListingRow } from "@/lib/member/listing-rows";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { toListingUnlockId } from "@/lib/unlocks/entitlements";

export async function listMyFavorites(): Promise<MemberListingRow[]> {
  if (!isSupabaseAuthConfigured()) return [];

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("user_favorites")
      .select(
        "listing_id, created_at, listings ( id, category, external_id, address, city, state, zip, price, price_label, image_url )",
      )
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) =>
      mapFavoriteRow(String(row.listing_id), String(row.created_at), row.listings),
    );
  } catch {
    return [];
  }
}

export async function listMyFavoriteIds(): Promise<string[]> {
  if (!isSupabaseAuthConfigured()) return [];

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase.from("user_favorites").select("listing_id");
    if (error || !data) return [];
    return data.map((row) => toListingUnlockId(String(row.listing_id)));
  } catch {
    return [];
  }
}

export async function isListingFavorited(listingId: string): Promise<boolean> {
  const normalized = toListingUnlockId(listingId.trim());
  if (!normalized) return false;
  const ids = await listMyFavoriteIds();
  return ids.includes(normalized);
}

export async function addFavorite(listingId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseAuthConfigured()) {
    return { ok: false, error: "Auth is not configured." };
  }

  const normalized = toListingUnlockId(listingId.trim());
  if (!normalized) return { ok: false, error: "Invalid listing." };

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { ok: false, error: "Sign in to save favorites." };

    const { error } = await supabase.from("user_favorites").insert({
      user_id: userData.user.id,
      listing_id: normalized,
    });

    if (error) {
      if (error.code === "23505") return { ok: true };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save favorite." };
  }
}

export async function removeFavorite(listingId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseAuthConfigured()) {
    return { ok: false, error: "Auth is not configured." };
  }

  const normalized = toListingUnlockId(listingId.trim());
  if (!normalized) return { ok: false, error: "Invalid listing." };

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("listing_id", normalized);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not remove favorite." };
  }
}
