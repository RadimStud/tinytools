import Link from "next/link";
import type { ReactNode } from "react";

export function PlatformShell({ title, children, platformAdmin = false }: { title: string; children: ReactNode; platformAdmin?: boolean }) {
  return <main className="min-h-screen bg-neutral-950 px-5 py-8 text-neutral-100"><div className="mx-auto max-w-6xl">
    <nav aria-label="Platform navigation" className="flex flex-wrap items-center justify-between gap-5 border-b border-neutral-800 pb-6">
      <Link href="/" className="text-xl font-semibold">MiniKit</Link>
      <div className="flex flex-wrap gap-5 text-sm text-neutral-300"><Link href="/dashboard">Market</Link><Link href="/apps">My apps</Link><Link href="/account">Account</Link>{platformAdmin && <Link href="/platform/admin">Platform administration</Link>}</div>
    </nav>
    <h1 className="mt-12 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
    <div className="mt-8">{children}</div>
  </div></main>;
}
export function PlatformUnavailable() {
  return <PlatformShell title="Platform not available"><p className="text-neutral-300">The shared platform has not been enabled here, or its configuration is temporarily unavailable. Existing Market access is unchanged.</p><Link className="mt-6 inline-block underline" href="/dashboard">Back to Market</Link></PlatformShell>;
}
