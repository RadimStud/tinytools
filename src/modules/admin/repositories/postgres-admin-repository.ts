import {
  count,
  desc,
  eq,
} from "drizzle-orm";

import {
  db,
} from "@/infrastructure/db/db";

import {
  tools,
  toolVersions,
  users,
} from "@/infrastructure/db/schema";

import type {
  AdminStats,
  AdminToolListItem,
  AdminUserListItem,
} from "../domain/admin-catalog";

import type {
  AdminRepository,
} from "./admin-repository";

export class PostgresAdminRepository
  implements AdminRepository
{
  async getStats():
    Promise<AdminStats> {
    const userRows =
      await db
        .select({
          total:
            count(),
        })
        .from(users);

    const toolRows =
      await db
        .select({
          status:
            tools.status,

          total:
            count(),
        })
        .from(tools)
        .groupBy(
          tools.status,
        );

    const totals = {
      published: 0,
      draft: 0,
      archived: 0,
    };

    for (const row of toolRows) {
      totals[row.status] =
        Number(row.total);
    }

    const totalTools =
      totals.published +
      totals.draft +
      totals.archived;

    return {
      totalUsers:
        Number(
          userRows[0]?.total ??
            0,
        ),

      totalTools,

      publishedTools:
        totals.published,

      draftTools:
        totals.draft,

      archivedTools:
        totals.archived,
    };
  }

  async listUsers(): Promise<
    AdminUserListItem[]
  > {
    const rows =
      await db
        .select({
          id: users.id,
          displayName:
            users.displayName,
          role: users.role,
          createdAt:
            users.createdAt,
        })
        .from(users)
        .orderBy(
          desc(
            users.createdAt,
          ),
        );

    return rows;
  }

  async listTools(): Promise<
    AdminToolListItem[]
  > {
    const rows =
      await db
        .select({
          id: tools.id,
          name: tools.name,
          slug: tools.slug,
          status:
            tools.status,
          ownerDisplayName:
            users.displayName,
          currentReleaseVersion:
            toolVersions.version,
          createdAt:
            tools.createdAt,
          updatedAt:
            tools.updatedAt,
        })
        .from(tools)
        .leftJoin(
          users,
          eq(
            users.id,
            tools.ownerId,
          ),
        )
        .leftJoin(
          toolVersions,
          eq(
            toolVersions.id,
            tools.currentVersionId,
          ),
        )
        .orderBy(
          desc(
            tools.updatedAt,
          ),
        );

    return rows;
  }
}
