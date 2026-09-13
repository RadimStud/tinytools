import Link from "next/link";
import { redirect } from "next/navigation";
import { services } from "@/server/services";
import { VaultError } from "@/modules/superuser/domain/vault";
import { getOrionWebUrl } from "@/modules/superuser/orion-launch";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "ORION | MiniKit Superuser" },
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function OrionLaunchPage() {
  // Recheck the existing database permission on every visit, including direct URLs.
  try {
    await services.vault.requireUser();
  } catch (error) {
    if (error instanceof VaultError) redirect(error.status === 401 ? "/login" : "/dashboard");
    throw error;
  }

  const destination = getOrionWebUrl();
  if (destination) redirect(destination);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto max-w-2xl">
        <Link href="/superuser" className="text-sm text-emerald-300 hover:text-emerald-200">← Superuser</Link>
        <p className="mt-16 font-mono text-xs tracking-[0.2em] text-cyan-300">YOUR AI WORKSPACE</p>
        <h1 className="mt-4 text-5xl font-semibold">ORION</h1>
        <p className="mt-5 text-lg text-neutral-300">Six assistants for your projects, ideas and everyday decisions.</p>
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6" role="status">
          <h2 className="font-semibold">ORION is not online yet.</h2>
          <p className="mt-2 leading-relaxed text-neutral-400">Web access is being prepared. Once it is ready, this button will take you to ORION’s sign-in page.</p>
        </div>
        <Link href="/dashboard" className="mt-8 inline-block text-sm text-neutral-400 hover:text-neutral-100">Back to dashboard</Link>
      </div>
    </main>
  );
}
