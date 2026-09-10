import { describe, expect, it } from "vitest";

import { InMemoryAdminRepository } from "../repositories/in-memory-admin-repository";

describe("InMemoryAdminRepository stats", () => {
  it("counts users and tools by status", async () => {
    const now =
      new Date(
        "2026-04-01T00:00:00.000Z",
      );

    const repository =
      new InMemoryAdminRepository(
        [
          {
            id: "u1",
            displayName: "Ada",
            role: "admin",
            createdAt: now,
          },
          {
            id: "u2",
            displayName: "Bob",
            role: "user",
            createdAt: now,
          },
        ],
        [
          {
            id: "t1",
            name: "Published Tool",
            slug: "published-tool",
            status: "published",
            ownerDisplayName: "Ada",
            currentReleaseVersion:
              "1.0.0",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "t2",
            name: "Draft Tool",
            slug: "draft-tool",
            status: "draft",
            ownerDisplayName: "Bob",
            currentReleaseVersion:
              null,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "t3",
            name: "Archived Tool",
            slug: "archived-tool",
            status: "archived",
            ownerDisplayName: null,
            currentReleaseVersion:
              "0.9.0",
            createdAt: now,
            updatedAt: now,
          },
        ],
      );

    await expect(
      repository.getStats(),
    ).resolves.toEqual({
      totalUsers: 2,
      totalTools: 3,
      publishedTools: 1,
      draftTools: 1,
      archivedTools: 1,
    });
  });
});
