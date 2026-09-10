import Link from "next/link";

import { ToolCard } from "@/modules/tools/components/tool-card";
import { services } from "@/server/services";

export const dynamic =
  "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params =
    await searchParams;

  const query =
    params.q?.trim() ?? "";

  const tools =
    await services.tools.searchTools(
      query,
    );

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← MiniKit Market
        </Link>

        <h1 className="mt-8 text-4xl font-semibold">
          Find a tool
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-400">
          Describe the problem you want to solve.
        </p>

        <form
          action="/search"
          className="mt-8 flex gap-3"
        >
          <input
            name="q"
            defaultValue={query}
            placeholder="Remove metadata from photos..."
            className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none focus:border-neutral-600"
          />

          <button
            type="submit"
            className="rounded-xl bg-neutral-100 px-6 font-medium text-neutral-950"
          >
            Search
          </button>
        </form>

        <p className="mt-8 text-sm text-neutral-500">
          {tools.length} result(s)
        </p>

        {tools.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {tools.map(
              (tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                />
              ),
            )}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
            <h2 className="text-xl font-medium">
              No matching tool yet.
            </h2>

            <p className="mt-2 text-neutral-400">
              Request it and we can use demand to decide what should be built next.
            </p>

            <Link
              href={`/request?problem=${encodeURIComponent(query)}`}
              className="mt-5 inline-block rounded-xl bg-neutral-100 px-5 py-3 font-medium text-neutral-950"
            >
              Request this tool
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}