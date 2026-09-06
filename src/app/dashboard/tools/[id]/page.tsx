import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  services,
} from "@/server/services";

import {
  archiveTool,
  createVersion,
  publishTool,
  updateTool,
} from "./actions";

import {
  VersionFileManager,
} from "./version-file-manager";

type ToolManagementPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    saved?: string;
    versionCreated?: string;
    archived?: string;
    published?: string;
    error?: string;
  }>;
};

function formatPriceInput(
  priceCents: number,
) {
  return (
    priceCents / 100
  ).toFixed(2);
}

export default async function ToolManagementPage({
  params,
  searchParams,
}: ToolManagementPageProps) {
  const appUser =
    await services.auth
      .syncCurrentUser();

  if (!appUser) {
    redirect(
      "/login",
    );
  }

  const {
    id,
  } = await params;

  const {
    saved,
    versionCreated,
    archived,
    published,
    error,
  } = await searchParams;

  const tool =
    await services.developerTools
      .getToolForOwner(
        id,
        appUser.id,
      );

  if (!tool) {
    notFound();
  }

  const updateAction =
    updateTool.bind(
      null,
      tool.id,
    );

  const versionAction =
    createVersion.bind(
      null,
      tool.id,
    );

  const publishAction =
    publishTool.bind(
      null,
      tool.id,
    );

  const archiveAction =
    archiveTool.bind(
      null,
      tool.id,
    );

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          â† Dashboard
        </Link>

        <div className="mt-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-semibold">
                {tool.name}
              </h1>

              <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs uppercase tracking-wide text-neutral-400">
                {tool.status}
              </span>
            </div>

            <p className="mt-3 text-neutral-400">
              {tool.slug}
            </p>
          </div>
        </div>

        {saved ? (
          <div className="mt-8 rounded-xl border border-emerald-900 bg-emerald-950/20 p-4 text-sm text-emerald-300">
            Tool updated successfully.
          </div>
        ) : null}

        {versionCreated ? (
          <div className="mt-8 rounded-xl border border-emerald-900 bg-emerald-950/20 p-4 text-sm text-emerald-300">
            Version created successfully.
          </div>
        ) : null}

        {published ? (
          <div className="mt-8 rounded-xl border border-emerald-900 bg-emerald-950/20 p-4 text-sm text-emerald-300">
            Tool published successfully.
          </div>
        ) : null}

        {archived ? (
          <div className="mt-8 rounded-xl border border-amber-900 bg-amber-950/20 p-4 text-sm text-amber-300">
            Tool archived.
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/20 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-xl font-medium">
              Tool information
            </h2>

            <form
              action={
                updateAction
              }
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm text-neutral-500"
                >
                  Name
                </label>

                <input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  defaultValue={
                    tool.name
                  }
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label
                  htmlFor="shortDescription"
                  className="mb-2 block text-sm text-neutral-500"
                >
                  Short description
                </label>

                <textarea
                  id="shortDescription"
                  name="shortDescription"
                  required
                  minLength={10}
                  rows={3}
                  defaultValue={
                    tool.shortDescription
                  }
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm text-neutral-500"
                >
                  Full description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={7}
                  defaultValue={
                    tool.description ??
                    ""
                  }
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label
                  htmlFor="priceEuros"
                  className="mb-2 block text-sm text-neutral-500"
                >
                  Price EUR
                </label>

                <input
                  id="priceEuros"
                  name="priceEuros"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    formatPriceInput(
                      tool.priceCents,
                    )
                  }
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                />
              </div>

              <fieldset>
                <legend className="mb-3 text-sm text-neutral-500">
                  Platforms
                </legend>

                <div className="flex flex-wrap gap-5">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="platform-windows"
                      defaultChecked={
                        tool.platforms.includes(
                          "windows",
                        )
                      }
                    />
                    Windows
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="platform-macos"
                      defaultChecked={
                        tool.platforms.includes(
                          "macos",
                        )
                      }
                    />
                    macOS
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="platform-linux"
                      defaultChecked={
                        tool.platforms.includes(
                          "linux",
                        )
                      }
                    />
                    Linux
                  </label>
                </div>
              </fieldset>

              <button
                type="submit"
                className="rounded-xl bg-neutral-100 px-5 py-3 font-medium text-neutral-950"
              >
                Save changes
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-medium">
                Versions
              </h2>

              <span className="text-sm text-neutral-500">
                {tool.versions.length}
              </span>
            </div>

            <form
              action={
                versionAction
              }
              className="mt-6"
            >
              <label
                htmlFor="version"
                className="mb-2 block text-sm text-neutral-500"
              >
                New version
              </label>

              <div className="flex gap-2">
                <input
                  id="version"
                  name="version"
                  required
                  placeholder="1.0.0"
                  className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-600"
                />

                <button
                  type="submit"
                  className="rounded-xl border border-neutral-700 px-4 py-3 text-sm hover:border-neutral-500"
                >
                  Create
                </button>
              </div>
            </form>

            {tool.versions.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-neutral-700 p-5">
                <p className="text-neutral-300">
                  No versions yet.
                </p>

                <p className="mt-2 text-sm text-neutral-500">
                  Create the first version, for example 1.0.0.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {tool.versions.map(
                  (version) => (
                    <div
                      key={
                        version.id
                      }
                      className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">
                          {
                            version.version
                          }
                        </span>

                        <span className="text-xs uppercase tracking-wide text-neutral-500">
                          {version.isActive
                            ? "active"
                            : "inactive"}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-neutral-600">
                        {version.fileKey
                          ? "Binary uploaded"
                          : "No binary uploaded"}
                      </p>

                      <VersionFileManager
                        toolId={
                          tool.id
                        }
                        versionId={
                          version.id
                        }
                        fileKey={
                          version.fileKey
                        }
                        checksum={
                          version.checksum
                        }
                      />

                      <p className="mt-1 text-xs text-neutral-700">
                        {version.createdAt.toLocaleString()}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-medium">
            Release
          </h2>

          {tool.status ===
          "published" ? (
            <div className="mt-4">
              <p className="text-sm text-emerald-300">
                This tool is published.
              </p>

              <Link
                href={`/tools/${tool.slug}`}
                className="mt-4 inline-block rounded-xl border border-neutral-700 px-5 py-3 text-sm hover:border-neutral-500"
              >
                View public page →
              </Link>
            </div>
          ) : tool.status ===
            "archived" ? (
            <p className="mt-4 text-sm text-neutral-500">
              Archived tools cannot be published.
            </p>
          ) : (
            <div className="mt-4">
              <p className="max-w-2xl text-sm leading-6 text-neutral-500">
                Publishing makes this tool visible in the marketplace.
                At least one active version must have a binary and SHA-256 checksum.
              </p>

              <form
                action={
                  publishAction
                }
                className="mt-5"
              >
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-5 py-3 font-medium text-neutral-950 hover:bg-emerald-400"
                >
                  Publish tool
                </button>
              </form>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-red-950 bg-neutral-900 p-6">
          <h2 className="text-xl font-medium text-red-300">
            Danger zone
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Archiving removes the tool from normal marketplace use without deleting its data.
          </p>

          {tool.status ===
          "archived" ? (
            <p className="mt-5 text-sm text-amber-300">
              This tool is archived.
            </p>
          ) : (
            <form
              action={
                archiveAction
              }
              className="mt-5"
            >
              <button
                type="submit"
                className="rounded-xl border border-red-900 px-5 py-3 text-sm text-red-300 hover:bg-red-950/30"
              >
                Archive tool
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}