import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!url || !key || !code) {
    return NextResponse.redirect(`${origin}/?login=required`);
  }

  const cookieStore = await cookies();
  const redirectTo = new URL(next, origin);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    redirectTo.pathname = "/";
    redirectTo.searchParams.set("login", "error");
    return NextResponse.redirect(redirectTo);
  }

  return NextResponse.redirect(redirectTo);
}
