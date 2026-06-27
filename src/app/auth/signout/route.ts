import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const { origin } = request.nextUrl;

  if (!url || !key) {
    return NextResponse.redirect(`${origin}/`);
  }

  const cookieStore = await cookies();
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

  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
