import Link from "next/link";

import {
  services,
} from "@/server/services";

export const dynamic =
  "force-dynamic";

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
  ).format(date);
}

function statusClass(
  status: string,
) {
  if (status === "published") {
    return "border-emerald-800 text-emerald-300";
  }

  if (status === "archived") {
    return "border-amber-800 text-amber-300";
  }

  return "border-neutral-700 text-neutral-400";
}

export default async function AdminToolsPage() {
  await services.adminAuth
    .requireAdmin();

  const tools =
    await services.admin
      .listTools();

  return (
    <main>
      <h2 className="text-3xl font-semibold">
        Tools
      </h2>

      <p className="mt-3 text-neutral-500">
        All statuses, including drafts and archived tools.
      </p>

      {tools.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-neutral-400">
          No tools yet.
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-800">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">
                  Name
                </th>
                <th className="px-4 py-3 font-medium">
                  Status
                </th>
                <th className="px-4 py-3 font-medium">
                  Owner
                </th>
                <th className="px-4 py-3 font-medium">
                  Current release
                </th>
                <th className="px-4 py-3 font-medium">
                  Updated
                </th>
              </tr>
            </thead>

            <tbody>
              {tools.map(
                (tool) => (
                  <tr
                    key={tool.id}
                    className="border-b border-neutral-900 last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {tool.name}
                      </div>

                      <div className="mt-1 text-xs text-neutral-600">
                        {tool.slug}
                      </div>

                      {tool.status ===
                      "published" ? (
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="mt-2 inline-block text-xs text-neutral-400 hover:text-neutral-200"
                        >
                          View public page →
                        </Link>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-wide ${statusClass(tool.status)}`}
                      >
                        {tool.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-neutral-300">
                      {tool.ownerDisplayName ??
                        "—"}
                    </td>

                    <td className="px-4 py-4 text-neutral-300">
                      {tool.currentReleaseVersion ??
                        "—"}
                    </td>

                    <td className="px-4 py-4 text-neutral-400">
                      {formatDate(
                        tool.updatedAt,
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
