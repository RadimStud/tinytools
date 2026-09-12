import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { safeRedirectPath } from "@/modules/auth/domain/safe-redirect";
import { services } from "@/server/services";

const authErrorPath = "/login?error=Authentication%20could%20not%20be%20completed.%20Please%20sign%20in%20again.";

function redirectTo(path: string, origin: string) {
  const response = NextResponse.redirect(new URL(path, origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return redirectTo("/login?error=Missing%20authentication%20code", url.origin);

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return redirectTo(authErrorPath, url.origin);

    const user = await services.auth.syncCurrentUser();
    if (!user) return redirectTo(authErrorPath, url.origin);
  } catch {
    // Never log the callback code, session tokens or an upstream error payload.
    console.error("Authentication callback failed.");
    return redirectTo(authErrorPath, url.origin);
  }

  return redirectTo(safeRedirectPath(url.searchParams.get("next")), url.origin);
}
