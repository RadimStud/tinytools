import Link from "next/link";

import { ToolCard } from "@/modules/tools/components/tool-card";

import {
  services,
} from "@/server/services";

export const dynamic =
  "force-dynamic";

export default async function Home() {
  const [
    tools,
    authUser,
  ] =
    await Promise.all([
      services.tools.getTools(),
      services.auth
        .getAuthenticatedUser(),
    ]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="px-6 pb-20 pt-24">
        <div className="mx-auto max-w-5xl">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-lg font-semibold">
              MiniKit
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/request"
                className="rounded-xl border border-neutral-800 px-4 py-2 text-sm text-neutral-300"
              >
                Request tool
              </Link>

              {authUser ? (
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl border border-neutral-800 px-4 py-2 text-sm text-neutral-300"
                  >
                    Sign in
                  </Link>

                  <Link
                    href="/signup"
                    className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </nav>

          <div className="mt-24 max-w-4xl">
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
              Small tools. Specific problems.
            </p>

            <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-7xl">
              MiniKit
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
              MiniKit is a marketplace for small, focused software tools that solve specific problems.
            </p>

            <form
              action="/search"
              className="mt-10 flex max-w-3xl gap-3"
            >
              <input
                name="q"
                placeholder="What do you need to do?"
                className="min-w-0 flex-1 rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none focus:border-neutral-600"
              />

              <button
                type="submit"
                className="rounded-2xl bg-neutral-100 px-7 font-medium text-neutral-950"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-900 px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          <Link href="/workbench/csv-cleaner" className="rounded-2xl border border-emerald-900 bg-emerald-950/20 p-7 transition hover:border-emerald-500">
            <p className="text-xs uppercase tracking-widest text-emerald-300">Try in your browser · Free</p>
            <h2 className="mt-4 text-2xl font-semibold">CSV Cleaner</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">Remove duplicate rows, clear blanks and trim spaces. Preview the result. Your data stays in your browser.</p>
            <span className="mt-5 inline-block text-sm text-emerald-300">Open CSV Cleaner →</span>
          </Link>
          <Link href="/community" className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-7 transition hover:border-neutral-500">
            <p className="text-xs uppercase tracking-widest text-neutral-400">Build with us</p>
            <h2 className="mt-4 text-2xl font-semibold">Small problems. Shared ideas.</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">Bring a use case, test a tool or help improve it. Shape what MiniKit builds next.</p>
            <span className="mt-5 inline-block text-sm text-emerald-300">Join the community →</span>
          </Link>
        </div>
      </section>

      <section className="border-t border-neutral-900 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold">
                Available tools
              </h2>

              <p className="mt-2 text-neutral-500">
                Initial MiniKit catalog.
              </p>
            </div>

            <Link
              href="/search"
              className="text-sm text-neutral-400"
            >
              Browse all →
            </Link>
          </div>

          <div className="mt-8 grid gap-4">
            {tools.map(
              (tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                />
              ),
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
