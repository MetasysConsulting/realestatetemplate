import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseAuthConfigured } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("Supabase URL and anon key must be set for authentication.");
  }
  return createBrowserClient(url, key);
}

export function tryCreateSupabaseBrowserClient() {
  if (!isSupabaseAuthConfigured()) return null;
  try {
    return createSupabaseBrowserClient();
  } catch {
    return null;
  }
}
