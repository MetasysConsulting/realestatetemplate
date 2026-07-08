/**
 * Backend (listings + auth) is ON by default.
 * Set NEXT_PUBLIC_REOVANA_BACKEND_ENABLED=false to temporarily disconnect it.
 */
export function isReovanaBackendEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REOVANA_BACKEND_ENABLED !== "false";
}

export function getSupabaseUrl(): string | undefined {
  if (!isReovanaBackendEnabled()) return undefined;
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

export function getSupabaseAnonKey(): string | undefined {
  if (!isReovanaBackendEnabled()) return undefined;
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
}

export function isSupabaseAuthConfigured(): boolean {
  return isReovanaBackendEnabled() && Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
