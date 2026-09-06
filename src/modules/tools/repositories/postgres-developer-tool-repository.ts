import {
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";

import {
  db,
} from "@/infrastructure/db/db";

import {
  toolPlatforms,
  tools,
  toolVersions,
} from "@/infrastructure/db/schema";

import type {
  DeveloperToolDetail,
} from "../domain/developer-tool-detail";

import type {
  AttachDeveloperToolVersionFileInput,
  CreateDeveloperToolVersionInput,
  UpdateDeveloperToolInput,
} from "../domain/developer-tool-management";

import type {
  ToolPlatform,
} from "../domain/tool";

import type {
  DeveloperToolRepository,
} from "./developer-tool-repository";

export class PostgresDeveloperToolRepository
  implements DeveloperToolRepository
{
  async findByOwnerId(
    ownerId: string,
  ) {
    return db
      .select({
        id: tools.id,
        slug: tools.slug,
        name: tools.name,
        shortDescription:
          tools.shortDescription,
        priceCents:
          tools.priceCents,
        status:
          tools.status,
        createdAt:
          tools.createdAt,
      })
      .from(tools)
      .where(
        eq(
          tools.ownerId,
          ownerId,
        ),
      )
      .orderBy(
        desc(
          tools.createdAt,
        ),
      );
  }

  async findByIdForOwner(
    toolId: string,
    ownerId: string,
  ): Promise<DeveloperToolDetail | null> {
    const toolRows =
      await db
        .select({
          id:
            tools.id,

          ownerId:
            tools.ownerId,

          slug:
            tools.slug,

          name:
            tools.name,

          shortDescription:
            tools.shortDescription,

          description:
            tools.description,

          priceCents:
            tools.priceCents,

          currency:
            tools.currency,

          status:
            tools.status,

          createdAt:
            tools.createdAt,

          updatedAt:
            tools.updatedAt,
        })
        .from(tools)
        .where(
          and(
            eq(
              tools.id,
              toolId,
            ),
            eq(
              tools.ownerId,
              ownerId,
            ),
          ),
        )
        .limit(1);

    const tool =
      toolRows[0];

    if (!tool) {
      return null;
    }

    const platformRows =
      await db
        .select({
          platform:
            toolPlatforms.platform,
        })
        .from(
          toolPlatforms,
        )
        .where(
          eq(
            toolPlatforms.toolId,
            toolId,
          ),
        );

    const versionRows =
      await db
        .select({
          id:
            toolVersions.id,

          version:
            toolVersions.version,

          fileKey:
            toolVersions.fileKey,

          checksum:
            toolVersions.checksum,

          isActive:
            toolVersions.isActive,

          createdAt:
            toolVersions.createdAt,
        })
        .from(
          toolVersions,
        )
        .where(
          eq(
            toolVersions.toolId,
            toolId,
          ),
        )
        .orderBy(
          asc(
            toolVersions.createdAt,
          ),
        );

    return {
      ...tool,

      platforms:
        platformRows.map(
          (row) =>
            row.platform as ToolPlatform,
        ),

      versions:
        versionRows,
    };
  }

  async updateForOwner(
    input: UpdateDeveloperToolInput,
  ): Promise<boolean> {
    const existing =
      await db
        .select({
          id:
            tools.id,
        })
        .from(tools)
        .where(
          and(
            eq(
              tools.id,
              input.toolId,
            ),
            eq(
              tools.ownerId,
              input.ownerId,
            ),
          ),
        )
        .limit(1);

    if (!existing[0]) {
      return false;
    }

    await db.transaction(
      async (tx) => {
        await tx
          .update(tools)
          .set({
            name:
              input.name,

            shortDescription:
              input.shortDescription,

            description:
              input.description,

            priceCents:
              input.priceCents,

            updatedAt:
              new Date(),
          })
          .where(
            and(
              eq(
                tools.id,
                input.toolId,
              ),
              eq(
                tools.ownerId,
                input.ownerId,
              ),
            ),
          );

        await tx
          .delete(
            toolPlatforms,
          )
          .where(
            eq(
              toolPlatforms.toolId,
              input.toolId,
            ),
          );

        if (
          input.platforms.length >
          0
        ) {
          await tx
            .insert(
              toolPlatforms,
            )
            .values(
              input.platforms.map(
                (platform) => ({
                  toolId:
                    input.toolId,

                  platform,
                }),
              ),
            );
        }
      },
    );

    return true;
  }

  async createVersionForOwner(
    input: CreateDeveloperToolVersionInput,
  ): Promise<boolean> {
    const toolRows =
      await db
        .select({
          id:
            tools.id,
        })
        .from(tools)
        .where(
          and(
            eq(
              tools.id,
              input.toolId,
            ),
            eq(
              tools.ownerId,
              input.ownerId,
            ),
          ),
        )
        .limit(1);

    if (!toolRows[0]) {
      return false;
    }

    const existingVersions =
      await db
        .select({
          id:
            toolVersions.id,
        })
        .from(
          toolVersions,
        )
        .where(
          and(
            eq(
              toolVersions.toolId,
              input.toolId,
            ),
            eq(
              toolVersions.version,
              input.version,
            ),
          ),
        )
        .limit(1);

    if (existingVersions[0]) {
      throw new Error(
        `Version ${input.version} already exists.`,
      );
    }

    await db
      .insert(
        toolVersions,
      )
      .values({
        toolId:
          input.toolId,

        version:
          input.version,

        fileKey:
          null,

        checksum:
          null,

        isActive:
          true,
      });

    await db
      .update(tools)
      .set({
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          tools.id,
          input.toolId,
        ),
      );

    return true;
  }

  async attachFileToVersionForOwner(
    input: AttachDeveloperToolVersionFileInput,
  ): Promise<boolean> {
    const ownedTool =
      await db
        .select({
          id:
            tools.id,
        })
        .from(tools)
        .where(
          and(
            eq(
              tools.id,
              input.toolId,
            ),
            eq(
              tools.ownerId,
              input.ownerId,
            ),
          ),
        )
        .limit(1);

    if (!ownedTool[0]) {
      return false;
    }

    const updated =
      await db
        .update(
          toolVersions,
        )
        .set({
          fileKey:
            input.fileKey,

          checksum:
            input.checksum,
        })
        .where(
          and(
            eq(
              toolVersions.id,
              input.versionId,
            ),
            eq(
              toolVersions.toolId,
              input.toolId,
            ),
          ),
        )
        .returning({
          id:
            toolVersions.id,
        });

    if (!updated[0]) {
      return false;
    }

    await db
      .update(tools)
      .set({
        updatedAt:
          new Date(),
      })
      .where(
        and(
          eq(
            tools.id,
            input.toolId,
          ),
          eq(
            tools.ownerId,
            input.ownerId,
          ),
        ),
      );

    return true;
  }
  async archiveForOwner(
    toolId: string,
    ownerId: string,
  ): Promise<boolean> {
    const rows =
      await db
        .update(tools)
        .set({
          status:
            "archived",

          updatedAt:
            new Date(),
        })
        .where(
          and(
            eq(
              tools.id,
              toolId,
            ),
            eq(
              tools.ownerId,
              ownerId,
            ),
          ),
        )
        .returning({
          id:
            tools.id,
        });

    return Boolean(
      rows[0],
    );
  }
}