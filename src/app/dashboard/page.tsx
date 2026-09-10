import Link from "next/link";
import { redirect } from "next/navigation";

import {
  logout,
} from "@/app/auth/actions";

import {
  isAdminUser,
} from "@/modules/users/domain/user";

import {
  services,
} from "@/server/services";

type DashboardPageProps = {
  searchParams: Promise<{
    created?: string;
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

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const appUser =
    await services.auth
      .syncCurrentUser();

  if (!appUser) {
    redirect(
      "/login",
    );
  }

  const {
    created,
  } = await searchParams;

  const tools =
    await services.developerTools
      .getToolsForOwner(
        appUser.id,
      );

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-lg font-semibold"
          >
            MiniKit Market
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline">
              {appUser.displayName}
            </span>

            {isAdminUser(
              appUser,
            ) ? (
              <Link
                href="/admin"
                className="rounded-xl border border-neutral-800 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-600"
              >
                Admin
              </Link>
            ) : null}

            <form
              action={logout}
            >
              <button
                type="submit"
                className="rounded-xl border border-neutral-800 px-4 py-2 text-sm text-neutral-300"
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>

        <div className="mt-16 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
              Developer dashboard
            </p>

            <h1 className="mt-3 text-4xl font-semibold">
              Your tools
            </h1>
          </div>

          <Link
            href="/publish"
            className="rounded-xl bg-neutral-100 px-5 py-3 font-medium text-neutral-950"
          >
            Publish tool
          </Link>
        </div>

        {created ? (
          <div className="mt-8 rounded-xl border border-emerald-900 bg-emerald-950/20 p-4 text-sm text-emerald-300">
            Draft created successfully.
          </div>
        ) : null}

        {tools.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
            <h2 className="text-xl font-medium">
              No tools yet
            </h2>

            <p className="mt-2 text-neutral-400">
              Create your first MiniKit Market draft.
            </p>

            <Link
              href="/publish"
              className="mt-5 inline-block rounded-xl bg-neutral-100 px-5 py-3 font-medium text-neutral-950"
            >
              Create first tool
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {tools.map(
              (tool) => (
                <article
                  key={tool.id}
                  aria-label={tool.name}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-medium">
                          {tool.name}
                        </h2>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-wide ${
                            tool.status ===
                            "published"
                              ? "border-emerald-800 text-emerald-300"
                              : tool.status ===
                                  "archived"
                                ? "border-amber-800 text-amber-300"
                                : "border-neutral-700 text-neutral-400"
                          }`}
                        >
                          {tool.status}
                        </span>
                      </div>

                      <p className="mt-2 text-neutral-400">
                        {tool.shortDescription}
                      </p>

                      <p className="mt-4 text-xs text-neutral-600">
                        {tool.slug}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-neutral-300">
                        {formatPrice(
                          tool.priceCents,
                        )}
                      </div>

                      <Link
                        href={`/dashboard/tools/${tool.id}`}
                        className="mt-4 inline-block text-sm text-neutral-400 hover:text-neutral-100"
                      >
                        Manage →
                      </Link>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}