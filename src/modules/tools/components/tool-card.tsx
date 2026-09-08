import Link from "next/link";

import type { Tool } from "../domain/tool";

type ToolCardProps = {
  tool: Tool;
};

function formatPrice(priceCents: number) {
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

export function ToolCard({
  tool,
}: ToolCardProps) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="block rounded-2xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-neutral-600 hover:bg-neutral-900/80"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-xl font-medium text-neutral-100">
            {tool.name}
          </h2>

          <p className="mt-2 text-neutral-400">
            {tool.shortDescription}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-medium text-neutral-200">
            {formatPrice(tool.priceCents)}
          </div>

          {tool.release ? (
            <div className="mt-2 text-xs text-neutral-500">
              {tool.release.version}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tool.platforms.map(
          (platform) => (
            <span
              key={platform}
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs capitalize text-neutral-400"
            >
              {platform}
            </span>
          ),
        )}
      </div>
    </Link>
  );
}
