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

export default async function AdminUsersPage() {
  await services.adminAuth
    .requireAdmin();

  const users =
    await services.admin
      .listUsers();

  return (
    <main>
      <h2 className="text-3xl font-semibold">
        Users
      </h2>

      <p className="mt-3 text-neutral-500">
        Application accounts synced from Supabase Auth.
      </p>

      {users.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-neutral-400">
          No users yet.
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-800">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">
                  Display name
                </th>
                <th className="px-4 py-3 font-medium">
                  Role
                </th>
                <th className="px-4 py-3 font-medium">
                  Created
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map(
                (user) => (
                  <tr
                    key={user.id}
                    className="border-b border-neutral-900 last:border-b-0"
                  >
                    <td className="px-4 py-4 font-medium">
                      {user.displayName}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs uppercase tracking-wide text-neutral-400">
                        {user.role}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-neutral-400">
                      {formatDate(
                        user.createdAt,
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
