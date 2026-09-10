import Link from "next/link";

import {
  services,
} from "@/server/services";

export const dynamic =
  "force-dynamic";

export const metadata = {
  title: "TinyTools Admin",
};

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  await services.adminAuth
    .requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
              Internal
            </p>

            <h1 className="mt-2 text-xl font-semibold">
              TinyTools Admin
            </h1>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/admin"
              className="rounded-xl border border-neutral-800 px-4 py-2 text-neutral-300 hover:border-neutral-600"
            >
              Overview
            </Link>

            <Link
              href="/admin/tools"
              className="rounded-xl border border-neutral-800 px-4 py-2 text-neutral-300 hover:border-neutral-600"
            >
              Tools
            </Link>

            <Link
              href="/admin/users"
              className="rounded-xl border border-neutral-800 px-4 py-2 text-neutral-300 hover:border-neutral-600"
            >
              Users
            </Link>

            <Link
              href="/"
              className="rounded-xl bg-neutral-100 px-4 py-2 font-medium text-neutral-950"
            >
              Back to TinyTools
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {children}
      </div>
    </div>
  );
}
