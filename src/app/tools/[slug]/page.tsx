import Link from "next/link";
import { notFound } from "next/navigation";

import { services } from "@/server/services";

type ToolPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatPrice(
  priceCents: number,
) {
  if (priceCents === 0) {
    return "Free";
  }

  return new Intl.NumberFormat(
    "en",
    {
      style: "currency",
      currency: "EUR",
    },
  ).format(priceCents / 100);
}

export default async function ToolPage({
  params,
}: ToolPageProps) {
  const {
    slug,
  } = await params;

  const tool =
    await services.tools.getTool(
      slug,
    );

  if (!tool) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/search"
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Search tools
        </Link>

        <section className="mt-10 rounded-3xl border border-neutral-800 bg-neutral-900 p-8 md:p-12">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight">
                {tool.name}
              </h1>

              <p className="mt-5 text-lg leading-8 text-neutral-400">
                {tool.shortDescription}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {tool.platforms.map(
                  (platform) => (
                    <span
                      key={platform}
                      className="rounded-full border border-neutral-700 px-3 py-1 text-sm capitalize text-neutral-400"
                    >
                      {platform}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="min-w-44">
              <div className="text-3xl font-semibold">
                {formatPrice(
                  tool.priceCents,
                )}
              </div>

              <button
                type="button"
                disabled
                title="Downloads will be enabled in the next phase."
                className="mt-5 w-full cursor-not-allowed rounded-xl bg-neutral-100 px-6 py-3 font-medium text-neutral-950 opacity-60"
              >
                Download soon
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 p-6">
            <div className="text-sm text-neutral-500">
              Runs locally
            </div>

            <p className="mt-2 text-neutral-300">
              TinyTools are designed as focused utilities, not heavyweight SaaS products.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 p-6">
            <div className="text-sm text-neutral-500">
              Clear pricing
            </div>

            <p className="mt-2 text-neutral-300">
              Small software should have simple, understandable pricing.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 p-6">
            <div className="text-sm text-neutral-500">
              Specific purpose
            </div>

            <p className="mt-2 text-neutral-300">
              One tool should solve one clear problem well.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}