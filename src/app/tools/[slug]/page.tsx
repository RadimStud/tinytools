import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  services,
} from "@/server/services";

export const dynamic =
  "force-dynamic";

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
  ).format(
    priceCents / 100,
  );
}

function formatDate(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(
    date,
  );
}

function formatFileSize(
  bytes: number | null,
) {
  if (
    bytes === null ||
    bytes < 0
  ) {
    return null;
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  const isFree =
    tool.priceCents === 0;

  const hasRelease =
    Boolean(tool.release);

  const canDownload =
    isFree && hasRelease;

  const fileSize =
    formatFileSize(
      tool.release
        ?.fileSizeBytes ??
        null,
    );

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/search"
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Search tools
        </Link>

        <section className="mt-10 rounded-3xl border border-neutral-800 bg-neutral-900 p-8 md:p-12">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
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

            <div className="min-w-48">
              <div className="text-3xl font-semibold">
                {formatPrice(
                  tool.priceCents,
                )}
              </div>

              {isFree ? (
                canDownload ? (
                  <Link
                    href={`/tools/${tool.slug}/download`}
                    className="mt-5 block w-full rounded-xl bg-neutral-100 px-6 py-3 text-center font-medium text-neutral-950 hover:bg-white"
                  >
                    Download
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-5 w-full cursor-not-allowed rounded-xl bg-neutral-100 px-6 py-3 font-medium text-neutral-950 opacity-60"
                  >
                    Download unavailable
                  </button>
                )
              ) : (
                <button
                  type="button"
                  disabled
                  title="Payments will be enabled in a later phase."
                  className="mt-5 w-full cursor-not-allowed rounded-xl bg-neutral-100 px-6 py-3 font-medium text-neutral-950 opacity-60"
                >
                  Purchase soon
                </button>
              )}

              {tool.release ? (
                <p className="mt-4 text-sm text-neutral-500">
                  Current release:{" "}
                  <span className="text-neutral-300">
                    {tool.release.version}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
            <h2 className="text-2xl font-semibold">
              About this tool
            </h2>

            <div className="mt-5 whitespace-pre-wrap leading-7 text-neutral-300">
              {tool.description ??
                tool.shortDescription}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
            <h2 className="text-xl font-semibold">
              Release
            </h2>

            {tool.release ? (
              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="text-sm text-neutral-500">
                    Version
                  </dt>

                  <dd className="mt-1 font-medium">
                    {tool.release.version}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-neutral-500">
                    Released
                  </dt>

                  <dd className="mt-1 text-neutral-300">
                    {formatDate(
                      tool.release.createdAt,
                    )}
                  </dd>
                </div>

                {tool.release.originalFileName ? (
                  <div>
                    <dt className="text-sm text-neutral-500">
                      Filename
                    </dt>

                    <dd className="mt-1 break-all text-neutral-300">
                      {tool.release.originalFileName}
                    </dd>
                  </div>
                ) : null}

                {fileSize ? (
                  <div>
                    <dt className="text-sm text-neutral-500">
                      File size
                    </dt>

                    <dd className="mt-1 text-neutral-300">
                      {fileSize}
                    </dd>
                  </div>
                ) : null}

                <div>
                  <dt className="text-sm text-neutral-500">
                    SHA-256
                  </dt>

                  <dd className="mt-2 break-all font-mono text-xs leading-5 text-neutral-400">
                    {tool.release.checksum}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                No downloadable release is available.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 p-6">
            <div className="text-sm text-neutral-500">
              Runs locally
            </div>

            <p className="mt-2 text-neutral-300">
              Focused software that runs on your computer instead of requiring a heavyweight SaaS platform.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 p-6">
            <div className="text-sm text-neutral-500">
              Verifiable download
            </div>

            <p className="mt-2 text-neutral-300">
              Release checksums make it possible to verify the downloaded binary.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 p-6">
            <div className="text-sm text-neutral-500">
              Specific purpose
            </div>

            <p className="mt-2 text-neutral-300">
              One small tool should solve one clear problem well.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
