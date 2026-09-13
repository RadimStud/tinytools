import Link from "next/link";
import { redirect } from "next/navigation";
import { services } from "@/server/services";
import { updatePassword } from "@/app/auth/actions";
export const dynamic = "force-dynamic";
export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  if (!await services.auth.getAuthenticatedUser()) redirect("/login?next=%2Faccount%2Fpassword");
  const params = await searchParams;
  return <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100"><div className="mx-auto max-w-md">
    <Link href="/account" className="text-sm text-neutral-400">← Account</Link><h1 className="mt-10 text-3xl font-semibold">Change password</h1>
    {params.saved && <p role="status" className="mt-6 text-emerald-200">Password updated.</p>}
    {params.error && <p role="alert" className="mt-6 text-red-200">{params.error.slice(0, 300)}</p>}
    <form action={updatePassword} className="mt-8 space-y-5">
      <label className="block">New password<input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-900 p-4" /></label>
      <label className="block">Confirm password<input name="confirmation" type="password" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-900 p-4" /></label>
      <button className="rounded-xl bg-neutral-100 px-5 py-3 text-neutral-950">Update password</button>
    </form>
  </div></main>;
}
