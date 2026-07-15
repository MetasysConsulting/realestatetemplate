import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import type { SavedSearchRow } from "@/lib/member/saved-search-display";

export type { SavedSearchRow } from "@/lib/member/saved-search-display";
export { describeSavedSearchQuery } from "@/lib/member/saved-search-display";

export type SaveSearchInput = {
  title: string;
  searchUrl: string;
  queryJson?: Record<string, unknown>;
  emailAlerts?: boolean;
};

function formatSavedSearchTitle(query: Record<string, unknown>): string {
  const q = String(query.q ?? "").trim();
  const state = String(query.state ?? "").trim();
  if (q && state) return `${q}, ${state}`;
  if (q) return q;
  if (state) return state;
  return "Saved search";
}

export async function listMySavedSearches(): Promise<SavedSearchRow[]> {
  if (!isSupabaseAuthConfigured()) return [];

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("saved_searches")
      .select("id, title, search_url, query_json, email_alerts, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      searchUrl: String(row.search_url),
      queryJson: (row.query_json as Record<string, unknown>) ?? {},
      emailAlerts: Boolean(row.email_alerts),
      createdAt: String(row.created_at),
    }));
  } catch {
    return [];
  }
}

export async function createSavedSearch(
  input: SaveSearchInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isSupabaseAuthConfigured()) {
    return { ok: false, error: "Auth is not configured." };
  }

  const searchUrl = input.searchUrl.trim();
  if (!searchUrl.startsWith("/search")) {
    return { ok: false, error: "Invalid search URL." };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { ok: false, error: "Sign in to save searches." };

    const queryJson = input.queryJson ?? {};
    const title = input.title.trim() || formatSavedSearchTitle(queryJson);

    const { data, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: userData.user.id,
        title,
        search_url: searchUrl,
        query_json: queryJson,
        email_alerts: Boolean(input.emailAlerts),
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, error: "Could not save search." };
  }
}

export async function deleteSavedSearch(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseAuthConfigured()) {
    return { ok: false, error: "Auth is not configured." };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { error } = await supabase.from("saved_searches").delete().eq("id", id.trim());
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete saved search." };
  }
}
