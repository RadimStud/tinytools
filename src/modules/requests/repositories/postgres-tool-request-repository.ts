import { db } from "@/infrastructure/db/db";
import { toolRequests } from "@/infrastructure/db/schema";

import type {
  CreateToolRequestInput,
  ToolRequest,
} from "../domain/tool-request";

import type {
  ToolRequestRepository,
} from "./tool-request-repository";

export class PostgresToolRequestRepository
  implements ToolRequestRepository
{
  async create(
    input: CreateToolRequestInput,
  ): Promise<ToolRequest> {
    const rows =
      await db
        .insert(toolRequests)
        .values({
          description:
            input.description,
        })
        .returning();

    const row =
      rows[0];

    if (!row) {
      throw new Error(
        "Failed to create tool request.",
      );
    }

    return {
      id: row.id,
      description:
        row.description,
      votes:
        row.votes,
      bountyCents:
        row.bountyCents,
      createdAt:
        row.createdAt,
    };
  }
}