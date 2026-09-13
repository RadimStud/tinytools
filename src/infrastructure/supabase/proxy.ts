import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authRedirectOrigin } from "@/modules/auth/domain/auth-origin";
import { safeReturnPath } from "@/modules/auth/domain/return-path";

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data, error } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const privatePage = /^(?:\/dashboard|\/admin|\/superuser|\/account|\/apps|\/platform|\/publish)(?:\/|$)/.test(path);
  if (process.env.MINIKIT_PLATFORM_ENABLED === "1" && privatePage && (error || !data?.claims?.sub)) {
    // Optimistic denial only; every page/service still verifies the account and permissions.
    const origin = authRedirectOrigin(request.nextUrl.origin);
    if (!origin) return NextResponse.json({ error: "Authentication origin is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    const login = new URL("/login", origin);
    login.searchParams.set("next", safeReturnPath(path + request.nextUrl.search, "/apps"));
    const denied = NextResponse.redirect(login);
    denied.headers.set("Cache-Control", "private, no-store");
    response.cookies.getAll().forEach(cookie => denied.cookies.set(cookie));
    return denied;
  }
  return response;
}
