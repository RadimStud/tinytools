import Link from "next/link";
import { services } from "@/server/services";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;

  const query =
    params.q?.trim() ?? "";

  const tools =
    await services.tools.searchTools(query);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm text-neutral-500"
        >
          ← TinyTools
        </Link>

        <h1 className="mt-8 text-4xl font-semibold">
          Search
        </h1>

        <form
          action="/search"
          className="mt-8 flex gap-3"
        >
          <input
            name="q"
            defaultValue={query}
            placeholder="What do you need to do?"
            className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none"
          />

          <button
            type="submit"
            className="rounded-xl bg-neutral-100 px-6 text-neutral-950"
          >
            Search
          </button>
        </form>

        <p className="mt-8 text-neutral-500">
          {tools.length} result(s)
        </p>

        <div className="mt-4 space-y-4">
          {tools.map((tool) => (
            <article
              key={tool.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
            >
              <h2 className="text-xl font-medium">
                {tool.name}
              </h2>

              <p className="mt-2 text-neutral-400">
                {tool.shortDescription}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
