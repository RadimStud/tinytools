import Link from "next/link";
import { redirect } from "next/navigation";
import { services } from "@/server/services";
import { login, signup } from "@/app/auth/actions";
import { authLandingPath, safeReturnPath } from "../domain/return-path";
import { AuthChangeForm } from "./auth-change-form";

const input = "mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none focus:border-neutral-500";
export async function AccountEntry({ mode, searchParams }: {
  mode: "login" | "signup"; searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeReturnPath(params.next, authLandingPath());
  if (await services.auth.getAuthenticatedUser()) redirect(next);
  const creating = mode === "signup";
  return <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100"><div className="mx-auto max-w-md">
    <Link href="/" className="text-sm text-neutral-400">← MiniKit Market</Link>
    <h1 className="mt-10 text-4xl font-semibold">{creating ? "Create account" : "Sign in"}</h1>
    <p className="mt-3 text-neutral-400">One MiniKit account. Access to each application is managed separately.</p>
    {params.error && <p role="alert" className="mt-6 rounded-xl border border-red-900 p-4 text-red-200">{params.error.slice(0, 300)}</p>}
    <AuthChangeForm action={creating ? signup : login} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />
      {creating && <label className="block text-sm text-neutral-300">Display name<input name="displayName" required minLength={2} maxLength={100} autoComplete="name" className={input} /></label>}
      <label className="block text-sm text-neutral-300">Email<input name="email" type="email" required autoComplete="email" className={input} /></label>
      <label className="block text-sm text-neutral-300">Password<input name="password" type="password" required minLength={creating ? 8 : undefined} autoComplete={creating ? "new-password" : "current-password"} className={input} /></label>
      <button type="submit" className="w-full rounded-xl bg-neutral-100 px-6 py-4 font-medium text-neutral-950">{creating ? "Create account" : "Sign in"}</button>
    </AuthChangeForm>
    <div className="mt-6 flex flex-wrap justify-between gap-4 text-sm text-neutral-300">
      <Link href={`${creating ? "/login" : "/signup"}?${new URLSearchParams({ next })}`}>{creating ? "Sign in" : "Create one"}</Link>
      {!creating && <Link href="/forgot-password">Forgot password?</Link>}
    </div>
  </div></main>;
}
