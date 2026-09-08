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
  toolVersions,
} from "@/infrastructure/db/schema";

import type {
  PublicToolDownload,
  Tool,
  ToolPlatform,
  ToolRelease,
} from "../domain/tool";

import type {
  ToolRepository,
} from "./tool-repository";

type ToolRow = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string | null;
  priceCents: number;
  currency: string;
  platform: ToolPlatform | null;
  releaseVersion: string | null;
  releaseChecksum: string | null;
  releaseCreatedAt: Date | null;
  releaseOriginalFileName: string | null;
  releaseFileSizeBytes: number | null;
};

function toRelease(
  row: ToolRow,
): ToolRelease | null {
  if (
    !row.releaseVersion ||
    !row.releaseChecksum
  ) {
    return null;
  }

  return {
    version:
      row.releaseVersion,

    checksum:
      row.releaseChecksum,

    createdAt:
      row.releaseCreatedAt ??
      new Date(0),

    originalFileName:
      row.releaseOriginalFileName,

    fileSizeBytes:
      row.releaseFileSizeBytes,
  };
}

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

      description:
        row.description,

      priceCents:
        row.priceCents,

      currency:
        "EUR",

      platforms:
        row.platform
          ? [row.platform]
          : [],

      release:
        toRelease(row),
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

const publishedCatalogSelect = {
  id:
    tools.id,

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

  platform:
    toolPlatforms.platform,

  releaseVersion:
    toolVersions.version,

  releaseChecksum:
    toolVersions.checksum,

  releaseCreatedAt:
    toolVersions.createdAt,

  releaseOriginalFileName:
    toolVersions.originalFileName,

  releaseFileSizeBytes:
    toolVersions.fileSizeBytes,
} as const;

export class PostgresToolRepository
  implements ToolRepository
{
  async findAll():
    Promise<Tool[]> {
    const rows =
      await db
        .select(
          publishedCatalogSelect,
        )
        .from(tools)
        .leftJoin(
          toolPlatforms,
          eq(
            toolPlatforms.toolId,
            tools.id,
          ),
        )
        .leftJoin(
          toolVersions,
          eq(
            toolVersions.id,
            tools.currentVersionId,
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
        .select(
          publishedCatalogSelect,
        )
        .from(tools)
        .leftJoin(
          toolPlatforms,
          eq(
            toolPlatforms.toolId,
            tools.id,
          ),
        )
        .leftJoin(
          toolVersions,
          eq(
            toolVersions.id,
            tools.currentVersionId,
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

    return mapRows(
      rows,
    )[0] ?? null;
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
        .select(
          publishedCatalogSelect,
        )
        .from(tools)
        .leftJoin(
          toolPlatforms,
          eq(
            toolPlatforms.toolId,
            tools.id,
          ),
        )
        .leftJoin(
          toolVersions,
          eq(
            toolVersions.id,
            tools.currentVersionId,
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

              ilike(
                tools.description,
                pattern,
              ),
            ),
          ),
        );

    return mapRows(
      rows,
    );
  }

  async findPublicDownloadBySlug(
    slug: string,
  ): Promise<PublicToolDownload | null> {
    const rows =
      await db
        .select({
          slug:
            tools.slug,

          priceCents:
            tools.priceCents,

          fileKey:
            toolVersions.fileKey,

          checksum:
            toolVersions.checksum,

          originalFileName:
            toolVersions.originalFileName,

          contentType:
            toolVersions.contentType,

          fileSizeBytes:
            toolVersions.fileSizeBytes,

          isActive:
            toolVersions.isActive,

          versionToolId:
            toolVersions.toolId,

          toolId:
            tools.id,
        })
        .from(tools)
        .innerJoin(
          toolVersions,
          eq(
            toolVersions.id,
            tools.currentVersionId,
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
        )
        .limit(1);

    const row =
      rows[0];

    if (
      !row ||
      !row.fileKey ||
      !row.checksum ||
      !row.isActive ||
      row.versionToolId !==
        row.toolId
    ) {
      return null;
    }

    return {
      slug:
        row.slug,

      priceCents:
        row.priceCents,

      fileKey:
        row.fileKey,

      checksum:
        row.checksum,

      originalFileName:
        row.originalFileName,

      contentType:
        row.contentType,

      fileSizeBytes:
        row.fileSizeBytes,
    };
  }
}
