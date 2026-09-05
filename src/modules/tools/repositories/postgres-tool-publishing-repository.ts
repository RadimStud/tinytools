import { db } from "@/infrastructure/db/db";

import {
  toolPlatforms,
  tools,
} from "@/infrastructure/db/schema";

import type {
  PublishToolInput,
  ToolPublishingRepository,
} from "./tool-publishing-repository";

export class PostgresToolPublishingRepository
  implements ToolPublishingRepository
{
  async createDraft(
    input: PublishToolInput,
  ) {
    const inserted =
      await db
        .insert(tools)
        .values({
          ownerId:
            input.ownerId,

          name:
            input.name,

          slug:
            input.slug,

          shortDescription:
            input.shortDescription,

          priceCents:
            input.priceCents,

          currency:
            "EUR",

          status:
            "draft",
        })
        .returning({
          id:
            tools.id,

          slug:
            tools.slug,
        });

    const tool =
      inserted[0];

    if (!tool) {
      throw new Error(
        "Failed to create tool.",
      );
    }

    if (
      input.platforms.length >
      0
    ) {
      await db
        .insert(
          toolPlatforms,
        )
        .values(
          input.platforms.map(
            (platform) => ({
              toolId:
                tool.id,

              platform,
            }),
          ),
        );
    }

    return tool;
  }
}