import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

function shouldRedirectToWww(request: NextRequest): boolean {
  // Avoid breaking local dev and Vercel preview domains.
  if (process.env.NODE_ENV !== "production") return false;

  const host = request.headers.get("host")?.toLowerCase() ?? "";
  return host === "reovana.com";
}

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-profile",
  "/my-package",
  "/my-favorites",
  "/my-save-search",
  "/my-property",
  "/add-property",
];

function isProtectedPath(pathname: string): boolean {
  // Admin UI uses its own demo login under /admin — do not apply member gates.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return false;
  }
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  if (shouldRedirectToWww(request)) {
    const url = request.nextUrl.clone();
    url.host = "www.reovana.com";
    return NextResponse.redirect(url, 308);
  }

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("login", "required");
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
