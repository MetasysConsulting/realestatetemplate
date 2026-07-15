import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { isAdminEmail } from "@/lib/admin/admin-allowlist";
import { FORCE_PAYWALL_COOKIE } from "@/lib/unlocks/paywall-bypass-cookie";

function shouldRedirectToWww(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  return host === "reovana.com";
}

/** `?forcePaywall=1` → cookie on (admins see paywall). `?forcePaywall=0` → off. */
function applyForcePaywallQuery(request: NextRequest): NextResponse | null {
  const value = request.nextUrl.searchParams.get("forcePaywall");
  if (value !== "1" && value !== "0") return null;

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.searchParams.delete("forcePaywall");
  const response = NextResponse.redirect(redirectUrl);

  if (value === "1") {
    response.cookies.set(FORCE_PAYWALL_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
      sameSite: "lax",
    });
  } else {
    response.cookies.set(FORCE_PAYWALL_COOKIE, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
  }

  return response;
}

const MEMBER_PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-profile",
  "/billing",
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

  const forcePaywallResponse = applyForcePaywallQuery(request);
  if (forcePaywallResponse) return forcePaywallResponse;

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
    const nextPath = `${pathname}${request.nextUrl.search}`;
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("login", "required");
    // Preserve destination so login/register/Google return to Add Property, etc.
    if (nextPath.startsWith("/") && !nextPath.startsWith("//")) {
      redirectUrl.searchParams.set("next", nextPath);
    }
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
