/**
 * Backend (listings + auth) is ON by default.
 * Set NEXT_PUBLIC_REOVANA_BACKEND_ENABLED=false only for local template-only work.
 * Never set this to false on Vercel — listing pages will 404 and auth/listings stop.
 */
export function isReovanaBackendEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REOVANA_BACKEND_ENABLED !== "false";
}

/** Raw project URL — ignores the public backend kill-switch (for Stripe grants, analytics). */
export function getSupabaseProjectUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY
  );
}

/** Publishable/anon key — ignores the public backend kill-switch. */
export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
}

export function getSupabaseUrl(): string | undefined {
  if (!isReovanaBackendEnabled()) return undefined;
  return getSupabaseProjectUrl();
}

export function getSupabaseAnonKey(): string | undefined {
  if (!isReovanaBackendEnabled()) return undefined;
  return getSupabasePublishableKey();
}

export function isSupabaseAuthConfigured(): boolean {
  return isReovanaBackendEnabled() && Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
