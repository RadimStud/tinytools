import Link from "next/link";

import { services } from "@/server/services";

export default async function Home() {
  const tools =
    await services.tools.getTools();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-neutral-500">
            TinyTools
          </p>

          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
            Small software.
            <br />
            Specific problems.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
            Find focused desktop tools without installing oversized software
            suites.
          </p>

          <form
            action="/search"
            className="mt-10 flex gap-3"
          >
            <input
              name="q"
              placeholder="What do you need to do?"
              className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
            />

            <button
              type="submit"
              className="rounded-xl bg-neutral-100 px-6 py-4 font-medium text-neutral-950"
            >
              Search
            </button>
          </form>
        </div>

        <section className="mt-24">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-medium">
              Example tools
            </h2>

            <Link
              href="/api/health"
              className="text-sm text-neutral-500 hover:text-neutral-300"
            >
              API health
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {tools.map((tool) => (
              <article
                key={tool.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <h3 className="text-lg font-medium">
                  {tool.name}
                </h3>

                <p className="mt-2 text-neutral-400">
                  {tool.shortDescription}
                </p>

                <div className="mt-6 flex items-center justify-between text-sm">
                  <span className="text-neutral-500">
                    {tool.platforms.join(" · ")}
                  </span>

                  <span>
                    €
                    {(
                      tool.priceCents / 100
                    ).toFixed(2)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
