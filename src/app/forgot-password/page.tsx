import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";
export const dynamic = "force-dynamic";
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100"><div className="mx-auto max-w-md">
    <Link href="/login" className="text-sm text-neutral-400">← Sign in</Link><h1 className="mt-10 text-3xl font-semibold">Reset password</h1>
    <p className="mt-4 text-neutral-400">A recovery link opens in this browser. Your existing MiniKit identity and owned data remain the same.</p>
    {params.sent && <p role="status" className="mt-6 text-emerald-200">If the account can receive recovery email, a link has been requested. Check your inbox.</p>}
    {params.error && <p role="alert" className="mt-6 text-red-200">{params.error.slice(0, 300)}</p>}
    <form action={requestPasswordReset} className="mt-8 space-y-5"><label className="block">Email<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-900 p-4" /></label><button className="rounded-xl bg-neutral-100 px-5 py-3 text-neutral-950">Send recovery link</button></form>
  </div></main>;
}
