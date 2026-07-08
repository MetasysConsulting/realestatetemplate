import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseAuthConfigured } from "@/lib/supabase/env";

export async function createSupabaseAuthServerClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("Supabase URL and anon key must be set for authentication.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* Called from a Server Component — middleware handles refresh. */
        }
      },
    },
  });
}

export async function getAuthUser() {
  if (!isSupabaseAuthConfigured()) return null;

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}
