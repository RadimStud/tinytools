import Link from "next/link";
import { redirect } from "next/navigation";
import { services } from "@/server/services";
import { logout } from "@/app/auth/actions";
import { PlatformShell } from "@/modules/platform/components/platform-shell";
export const dynamic = "force-dynamic";
export const metadata = { title: "Account | MiniKit", robots: { index: false, follow: false } };
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await services.auth.syncCurrentUser();
  if (!user) redirect("/login?next=%2Faccount");
  const params = await searchParams;
  return <PlatformShell title="Account"><section className="max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
    <h2 className="text-xl font-medium">{user.displayName}</h2><p className="mt-4 text-sm text-neutral-400">Stable identity (Supabase Auth UUID)</p><p className="mt-2 break-all font-mono text-sm">{user.authUserId}</p>
    <p className="mt-5 text-sm leading-6 text-neutral-300">Application permissions are independent of this account. Marketplace administration does not grant platform administration or access to private files.</p>
    {params.error && <p role="alert" className="mt-4 text-red-200">{params.error.slice(0, 300)}</p>}
    <div className="mt-6 flex flex-wrap items-center gap-5"><Link className="underline" href="/account/password">Change password</Link><form action={logout}><button className="rounded-lg border border-neutral-700 px-4 py-3">Sign out everywhere</button></form></div>
    <p className="mt-4 text-xs text-neutral-400">Global sign-out revokes Supabase refresh sessions. Already issued access tokens can remain valid until their expiry. This does not log out the separate single-owner ORION server.</p>
  </section></PlatformShell>;
}
