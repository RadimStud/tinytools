import { describe, expect, it } from "vitest";

import type {
  AppUser,
} from "../domain/user";

import { InMemoryUserRepository } from "./in-memory-user-repository";

describe("InMemoryUserRepository.findOrCreate", () => {
  it("does not overwrite an existing admin role", async () => {
    const admin: AppUser = {
      id: "user-1",
      authUserId: "auth-admin",
      displayName: "Ada",
      role: "admin",
      createdAt: new Date(
        "2026-01-01T00:00:00.000Z",
      ),
    };

    const repository =
      new InMemoryUserRepository([
        admin,
      ]);

    const result =
      await repository.findOrCreate({
        authUserId:
          "auth-admin",
        displayName:
          "Ada Updated",
      });

    expect(result.role).toBe(
      "admin",
    );
    expect(result.displayName).toBe(
      "Ada",
    );

    const stored =
      await repository.findByAuthUserId(
        "auth-admin",
      );

    expect(stored?.role).toBe(
      "admin",
    );
  });

  it("creates new users as role user", async () => {
    const repository =
      new InMemoryUserRepository();

    const created =
      await repository.findOrCreate({
        authUserId: "auth-new",
        displayName: "New user",
      });

    expect(created.role).toBe(
      "user",
    );
  });
});
