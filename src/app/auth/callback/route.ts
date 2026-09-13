import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { authLandingPath, safeReturnPath } from "@/modules/auth/domain/return-path";
import { authRedirectOrigin } from "@/modules/auth/domain/auth-origin";
import { authCompletionPath } from "@/modules/auth/domain/auth-completion";
import { services } from "@/server/services";

const authErrorPath = "/login?error=Authentication%20could%20not%20be%20completed.%20Please%20sign%20in%20again.";
function redirectTo(path: string, origin: string) {
  const response = NextResponse.redirect(new URL(path, origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = authRedirectOrigin(url.origin);
  if (!origin) return NextResponse.json({ error: "Authentication origin is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const code = url.searchParams.get("code");
  if (!code) return redirectTo("/login?error=Missing%20authentication%20code", origin);
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return redirectTo(authErrorPath, origin);
    const user = await services.auth.syncCurrentUser();
    if (!user) return redirectTo(authErrorPath, origin);
  } catch {
    console.error("Authentication callback failed.");
    return redirectTo(authErrorPath, origin);
  }
  return redirectTo(authCompletionPath(safeReturnPath(url.searchParams.get("next"), authLandingPath())), origin);
}
