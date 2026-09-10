import {
  services,
} from "@/server/services";

export const dynamic =
  "force-dynamic";

export default async function AdminOverviewPage() {
  await services.adminAuth
    .requireAdmin();

  const stats =
    await services.admin
      .getStats();

  const cards = [
    {
      label: "Users",
      value: stats.totalUsers,
    },
    {
      label: "Tools",
      value: stats.totalTools,
    },
    {
      label: "Published",
      value:
        stats.publishedTools,
    },
    {
      label: "Draft",
      value: stats.draftTools,
    },
    {
      label: "Archived",
      value:
        stats.archivedTools,
    },
  ];

  return (
    <main>
      <h2 className="text-3xl font-semibold">
        Overview
      </h2>

      <p className="mt-3 text-neutral-500">
        Read-only snapshot of marketplace accounts and tools.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <section
            key={card.label}
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
          >
            <p className="text-sm text-neutral-500">
              {card.label}
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {card.value}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
