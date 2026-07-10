import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { isAdminEmail } from "@/lib/admin/admin-allowlist";

function shouldRedirectToWww(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  return host === "reovana.com";
}

const MEMBER_PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-profile",
  "/my-package",
  "/my-favorites",
  "/my-save-search",
  "/my-property",
  "/add-property",
];

function isMemberProtectedPath(pathname: string): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return false;
  return MEMBER_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminAuthPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname === "/admin/login" ||
    pathname === "/admin/register"
  );
}

function isAdminApiPath(pathname: string): boolean {
  return pathname === "/admin/api" || pathname.startsWith("/admin/api/");
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

  const pathname = request.nextUrl.pathname;
  const isAdmin = Boolean(user && isAdminEmail(user.email));

  if (isAdminPath(pathname)) {
    if (isAdminAuthPath(pathname)) {
      if (isAdmin) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/admin/home";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    } else if (!isAdmin) {
      // API routes should return JSON 401, not an HTML login redirect.
      if (isAdminApiPath(pathname)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.search = "";
      if (user) {
        redirectUrl.searchParams.set("error", "unauthorized");
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isMemberProtectedPath(pathname) && !user) {
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
