import {
  desc,
  eq,
} from "drizzle-orm";

import { db } from "@/infrastructure/db/db";
import { tools } from "@/infrastructure/db/schema";

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
}