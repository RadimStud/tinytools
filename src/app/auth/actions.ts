"use server";

import {
  headers,
} from "next/headers";

import {
  redirect,
} from "next/navigation";

import {
  createSupabaseServerClient,
} from "@/infrastructure/supabase/server-client";

import {
  services,
} from "@/server/services";

function encoded(
  value: string,
) {
  return encodeURIComponent(
    value,
  );
}

export async function login(
  formData: FormData,
) {
  const email =
    String(
      formData.get("email") ??
        "",
    ).trim();

  const password =
    String(
      formData.get("password") ??
        "",
    );

  const supabase =
    await createSupabaseServerClient();

  const {
    error,
  } =
    await supabase.auth
      .signInWithPassword({
        email,
        password,
      });

  if (error) {
    redirect(
      `/login?error=${encoded(error.message)}`,
    );
  }

  await services.auth
    .syncCurrentUser();

  redirect(
    "/dashboard",
  );
}

export async function signup(
  formData: FormData,
) {
  const displayName =
    String(
      formData.get(
        "displayName",
      ) ?? "",
    ).trim();

  const email =
    String(
      formData.get("email") ??
        "",
    ).trim();

  const password =
    String(
      formData.get("password") ??
        "",
    );

  if (
    displayName.length < 2
  ) {
    redirect(
      "/signup?error=Display%20name%20is%20too%20short",
    );
  }

  if (
    password.length < 8
  ) {
    redirect(
      "/signup?error=Password%20must%20have%20at%20least%208%20characters",
    );
  }

  const requestHeaders =
    await headers();

  const origin =
    requestHeaders.get(
      "origin",
    ) ??
    "http://localhost:3000";

  const callbackUrl =
    new URL(
      "/auth/callback",
      origin,
    );

  callbackUrl.searchParams.set(
    "next",
    "/dashboard",
  );

  const supabase =
    await createSupabaseServerClient();

  const {
    data,
    error,
  } =
    await supabase.auth.signUp({
      email,
      password,

      options: {
        emailRedirectTo:
          callbackUrl.toString(),

        data: {
          display_name:
            displayName,
        },
      },
    });

  if (error) {
    redirect(
      `/signup?error=${encoded(error.message)}`,
    );
  }

  if (data.session) {
    await services.auth
      .syncCurrentUser();

    redirect(
      "/dashboard",
    );
  }

  redirect(
    `/signup/check-email?email=${encoded(email)}`,
  );
}

export async function logout() {
  const supabase =
    await createSupabaseServerClient();

  await supabase.auth.signOut();

  redirect(
    "/",
  );
}