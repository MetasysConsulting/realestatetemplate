import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";

export type MemberNavCounts = {
  favorites: number;
  savedSearches: number;
  unlocks: number;
};

export async function getMemberNavCounts(): Promise<MemberNavCounts> {
  if (!isSupabaseAuthConfigured()) {
    return { favorites: 0, savedSearches: 0, unlocks: 0 };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const nowIso = new Date().toISOString();

    const [favorites, savedSearches, unlocks] = await Promise.all([
      supabase.from("user_favorites").select("id", { count: "exact", head: true }),
      supabase.from("saved_searches").select("id", { count: "exact", head: true }),
      supabase
        .from("listing_unlocks")
        .select("id", { count: "exact", head: true })
        .is("revoked_at", null)
        .or(`expires_at.is.null,expires_at.gt."${nowIso}"`),
    ]);

    return {
      favorites: favorites.count ?? 0,
      savedSearches: savedSearches.count ?? 0,
      unlocks: unlocks.count ?? 0,
    };
  } catch {
    return { favorites: 0, savedSearches: 0, unlocks: 0 };
  }
}
