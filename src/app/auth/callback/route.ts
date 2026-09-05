import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  createSupabaseServerClient,
} from "@/infrastructure/supabase/server-client";

import {
  services,
} from "@/server/services";

export async function GET(
  request: NextRequest,
) {
  const requestUrl =
    new URL(
      request.url,
    );

  const code =
    requestUrl.searchParams
      .get("code");

  const next =
    requestUrl.searchParams
      .get("next") ||
    "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/login?error=Missing%20authentication%20code",
        requestUrl.origin,
      ),
    );
  }

  const supabase =
    await createSupabaseServerClient();

  const {
    error,
  } =
    await supabase.auth
      .exchangeCodeForSession(
        code,
      );

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.message)}`,
        requestUrl.origin,
      ),
    );
  }

  await services.auth
    .syncCurrentUser();

  const safeNext =
    next.startsWith("/")
      ? next
      : "/dashboard";

  return NextResponse.redirect(
    new URL(
      safeNext,
      requestUrl.origin,
    ),
  );
}