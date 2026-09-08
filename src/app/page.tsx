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
          <nav className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              TinyTools
            </div>

            <div className="flex gap-3">
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
              Small software. Specific problems.
            </p>

            <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-7xl">
              Find the tiny tool that solves exactly what you need.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
              Lightweight utilities for jobs too small for heavyweight software.
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

      <section className="border-t border-neutral-900 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold">
                Available tools
              </h2>

              <p className="mt-2 text-neutral-500">
                Initial TinyTools catalog.
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