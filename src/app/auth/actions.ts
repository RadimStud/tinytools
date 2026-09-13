"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { services } from "@/server/services";
import { authLandingPath, safeReturnPath } from "@/modules/auth/domain/return-path";
import { authCompletionPath } from "@/modules/auth/domain/auth-completion";
import { authOrigin } from "@/modules/auth/domain/auth-origin";

function text(data: FormData, name: string) { return String(data.get(name) ?? ""); }
function fail(page: string, message: string, next?: string): never {
  const query = new URLSearchParams({ error: message });
  if (next) query.set("next", next);
  redirect(`${page}?${query}`);
}
function complete(next: string): never {
  revalidatePath("/", "layout");
  redirect(authCompletionPath(next));
}

export async function login(formData: FormData) {
  const next = safeReturnPath(formData.get("next"), authLandingPath());
  let ok = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: text(formData, "email").trim(), password: text(formData, "password"),
    });
    ok = !error && !!await services.auth.syncCurrentUser();
  } catch { /* Do not expose upstream errors or supplied credentials. */ }
  if (!ok) fail("/login", "Sign in could not be completed. Check your credentials and try again.", next);
  complete(next);
}

export async function signup(formData: FormData) {
  const next = safeReturnPath(formData.get("next"), authLandingPath());
  const displayName = text(formData, "displayName").trim();
  const email = text(formData, "email").trim();
  const password = text(formData, "password");
  if (displayName.length < 2 || displayName.length > 100) fail("/signup", "Display name must contain 2–100 characters.", next);
  if (password.length < 8) fail("/signup", "Password must have at least 8 characters.", next);
  const origin = authOrigin((await headers()).get("origin"));
  if (!origin) fail("/signup", "This sign-up origin is not configured.", next);
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);
  let signedIn = false;
  let ok = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: callbackUrl.toString(), data: { display_name: displayName } },
    });
    if (!error) {
      ok = true;
      if (data.session) signedIn = !!await services.auth.syncCurrentUser();
    }
  } catch { /* Generic response only. No roles are read from user metadata. */ }
  if (!ok) fail("/signup", "Registration could not be completed. Please try again later.", next);
  if (signedIn) complete(next);
  redirect(`/signup/check-email?${new URLSearchParams({ email, next })}`);
}

export async function logout() {
  let ok = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    ok = !error;
  } catch { /* Keep the failure explicit; do not pretend revocation succeeded. */ }
  if (!ok) fail("/account", "Sign out could not be completed. Please try again.");
  complete("/");
}

export async function requestPasswordReset(formData: FormData) {
  const origin = authOrigin((await headers()).get("origin"));
  if (!origin) fail("/forgot-password", "This recovery origin is not configured.");
  const email = text(formData, "email").trim();
  if (!email || email.length > 320) fail("/forgot-password", "Enter a valid email address.");
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: new URL("/auth/callback?next=%2Faccount%2Fpassword", origin).toString(),
    });
  } catch { /* Same response regardless of account existence or upstream failure. */ }
  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  if (!await services.auth.getAuthenticatedUser()) redirect("/login?next=%2Faccount%2Fpassword");
  const password = text(formData, "password");
  if (password.length < 8 || password !== text(formData, "confirmation")) fail("/account/password", "Use matching passwords of at least 8 characters.");
  let ok = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });
    ok = !error;
  } catch { /* Do not put auth diagnostics into the browser. */ }
  if (!ok) fail("/account/password", "Password could not be updated. Sign in again or request a fresh recovery link.");
  complete("/account/password?saved=1");
}
