import {
  and,
  eq,
  ilike,
  or,
} from "drizzle-orm";

import {
  db,
} from "@/infrastructure/db/db";

import {
  toolPlatforms,
  tools,
} from "@/infrastructure/db/schema";

import type {
  Tool,
  ToolPlatform,
} from "../domain/tool";

import type {
  ToolRepository,
} from "./tool-repository";

type ToolRow = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  priceCents: number;
  currency: string;
  platform: ToolPlatform | null;
};

function mapRows(
  rows: ToolRow[],
): Tool[] {
  const map =
    new Map<string, Tool>();

  for (const row of rows) {
    const existingTool =
      map.get(row.id);

    if (existingTool) {
      if (
        row.platform &&
        !existingTool.platforms.includes(
          row.platform,
        )
      ) {
        existingTool.platforms.push(
          row.platform,
        );
      }

      continue;
    }

    const tool: Tool = {
      id:
        row.id,

      slug:
        row.slug,

      name:
        row.name,

      shortDescription:
        row.shortDescription,

      priceCents:
        row.priceCents,

      currency:
        "EUR",

      platforms:
        row.platform
          ? [row.platform]
          : [],
    };

    map.set(
      row.id,
      tool,
    );
  }

  return [
    ...map.values(),
  ];
}
export class PostgresToolRepository
  implements ToolRepository
{
  async findAll():
    Promise<Tool[]> {
    const rows =
      await db
        .select({
          id:
            tools.id,

          slug:
            tools.slug,

          name:
            tools.name,

          shortDescription:
            tools.shortDescription,

          priceCents:
            tools.priceCents,

          currency:
            tools.currency,

          platform:
            toolPlatforms.platform,
        })
        .from(tools)
        .leftJoin(
          toolPlatforms,
          eq(
            toolPlatforms.toolId,
            tools.id,
          ),
        )
        .where(
          eq(
            tools.status,
            "published",
          ),
        );

    return mapRows(
      rows,
    );
  }

  async findBySlug(
    slug: string,
  ): Promise<Tool | null> {
    const rows =
      await db
        .select({
          id:
            tools.id,

          slug:
            tools.slug,

          name:
            tools.name,

          shortDescription:
            tools.shortDescription,

          priceCents:
            tools.priceCents,

          currency:
            tools.currency,

          platform:
            toolPlatforms.platform,
        })
        .from(tools)
        .leftJoin(
          toolPlatforms,
          eq(
            toolPlatforms.toolId,
            tools.id,
          ),
        )
        .where(
          and(
            eq(
              tools.slug,
              slug,
            ),
            eq(
              tools.status,
              "published",
            ),
          ),
        );

    return (
      mapRows(
        rows,
      )[0] ??
      null
    );
  }

  async search(
    query: string,
  ): Promise<Tool[]> {
    const normalized =
      query.trim();

    if (!normalized) {
      return this.findAll();
    }

    const pattern =
      `%${normalized}%`;

    const rows =
      await db
        .select({
          id:
            tools.id,

          slug:
            tools.slug,

          name:
            tools.name,

          shortDescription:
            tools.shortDescription,

          priceCents:
            tools.priceCents,

          currency:
            tools.currency,

          platform:
            toolPlatforms.platform,
        })
        .from(tools)
        .leftJoin(
          toolPlatforms,
          eq(
            toolPlatforms.toolId,
            tools.id,
          ),
        )
        .where(
          and(
            eq(
              tools.status,
              "published",
            ),
            or(
              ilike(
                tools.name,
                pattern,
              ),

              ilike(
                tools.shortDescription,
                pattern,
              ),
            ),
          ),
        );

    return mapRows(
      rows,
    );
  }
}