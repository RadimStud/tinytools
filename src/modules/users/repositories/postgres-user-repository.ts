import { eq } from "drizzle-orm";

import { db } from "@/infrastructure/db/db";
import { users } from "@/infrastructure/db/schema";

import type {
  AppUser,
} from "../domain/user";

import type {
  CreateUserInput,
  UserRepository,
} from "./user-repository";

function mapUser(
  row: typeof users.$inferSelect,
): AppUser {
  if (!row.authUserId) {
    throw new Error(
      "User is missing auth_user_id.",
    );
  }

  return {
    id: row.id,
    authUserId:
      row.authUserId,
    displayName:
      row.displayName,
    createdAt:
      row.createdAt,
  };
}

export class PostgresUserRepository
  implements UserRepository
{
  async findByAuthUserId(
    authUserId: string,
  ): Promise<AppUser | null> {
    const rows =
      await db
        .select()
        .from(users)
        .where(
          eq(
            users.authUserId,
            authUserId,
          ),
        )
        .limit(1);

    const row =
      rows[0];

    return row
      ? mapUser(row)
      : null;
  }

  async findOrCreate(
    input: CreateUserInput,
  ): Promise<AppUser> {
    const existing =
      await this.findByAuthUserId(
        input.authUserId,
      );

    if (existing) {
      return existing;
    }

    const inserted =
      await db
        .insert(users)
        .values({
          authUserId:
            input.authUserId,

          displayName:
            input.displayName,
        })
        .onConflictDoNothing({
          target:
            users.authUserId,
        })
        .returning();

    const created =
      inserted[0];

    if (created) {
      return mapUser(
        created,
      );
    }

    const raced =
      await this.findByAuthUserId(
        input.authUserId,
      );

    if (!raced) {
      throw new Error(
        "Failed to create application user.",
      );
    }

    return raced;
  }
}