import { describe, expect, it } from "vitest";

import type {
  DeveloperToolDetail,
} from "../domain/developer-tool-detail";

import { InMemoryDeveloperToolRepository } from "../repositories/in-memory-developer-tool-repository";

import { DeveloperToolService } from "./developer-tool-service";

const validChecksum =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function createDraftTool(
  overrides: Partial<DeveloperToolDetail> = {},
): DeveloperToolDetail {
  const now =
    new Date(
      "2026-03-01T12:00:00.000Z",
    );

  return {
    id: "tool-1",
    ownerId: "owner-1",
    slug: "metadata-cleaner",
    name: "Metadata Cleaner",
    shortDescription:
      "Remove metadata from local photos.",
    description:
      "A focused local utility that strips EXIF and GPS metadata from files.",
    priceCents: 0,
    currency: "EUR",
    status: "draft",
    currentVersionId: null,
    platforms: ["windows"],
    versions: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createUploadedVersion(
  id: string,
  version: string,
  createdAt: Date,
) {
  return {
    id,
    version,
    fileKey: `tools/tool-1/${version}/app.exe`,
    checksum: validChecksum,
    originalFileName: "app.exe",
    contentType: "application/octet-stream",
    fileSizeBytes: 128,
    isActive: true,
    createdAt,
  };
}

function createService(
  tool: DeveloperToolDetail,
) {
  return new DeveloperToolService(
    new InMemoryDeveloperToolRepository([
      tool,
    ]),
  );
}

describe("DeveloperToolService", () => {
  it("rejects duplicate versions", async () => {
    const service =
      createService(
        createDraftTool({
          versions: [
            createUploadedVersion(
              "v1",
              "1.0.0",
              new Date(
                "2026-03-01T12:00:00.000Z",
              ),
            ),
          ],
        }),
      );

    await expect(
      service.createVersion({
        toolId: "tool-1",
        ownerId: "owner-1",
        version: "1.0.0",
      }),
    ).rejects.toThrow(
      "Version already exists.",
    );
  });

  it("rejects invalid semver", async () => {
    const service =
      createService(
        createDraftTool(),
      );

    await expect(
      service.createVersion({
        toolId: "tool-1",
        ownerId: "owner-1",
        version: "v1",
      }),
    ).rejects.toThrow(
      "Use a version such as 1.0.0 or 1.0.0-beta.1.",
    );
  });

  it("rejects publish without a version", async () => {
    const service =
      createService(
        createDraftTool(),
      );

    await expect(
      service.publishTool(
        "tool-1",
        "owner-1",
      ),
    ).rejects.toThrow(
      "Binary must be uploaded before publishing.",
    );
  });

  it("rejects publish without a binary", async () => {
    const service =
      createService(
        createDraftTool({
          versions: [
            {
              id: "v1",
              version: "1.0.0",
              fileKey: null,
              checksum: null,
              originalFileName: null,
              contentType: null,
              fileSizeBytes: null,
              isActive: true,
              createdAt: new Date(
                "2026-03-01T12:00:00.000Z",
              ),
            },
          ],
        }),
      );

    await expect(
      service.publishTool(
        "tool-1",
        "owner-1",
      ),
    ).rejects.toThrow(
      "Binary must be uploaded before publishing.",
    );
  });

  it("rejects publish without a valid checksum", async () => {
    const service =
      createService(
        createDraftTool({
          versions: [
            {
              id: "v1",
              version: "1.0.0",
              fileKey:
                "tools/tool-1/1.0.0/app.exe",
              checksum: "not-a-hash",
              originalFileName: "app.exe",
              contentType:
                "application/octet-stream",
              fileSizeBytes: 10,
              isActive: true,
              createdAt: new Date(
                "2026-03-01T12:00:00.000Z",
              ),
            },
          ],
        }),
      );

    await expect(
      service.publishTool(
        "tool-1",
        "owner-1",
        "v1",
      ),
    ).rejects.toThrow(
      "Checksum is invalid.",
    );
  });

  it("publishes a draft with a valid uploaded version and stores currentVersionId", async () => {
    const tool =
      createDraftTool({
        versions: [
          createUploadedVersion(
            "v-old",
            "1.0.0",
            new Date(
              "2026-03-01T10:00:00.000Z",
            ),
          ),
          createUploadedVersion(
            "v-new",
            "1.0.1",
            new Date(
              "2026-03-01T11:00:00.000Z",
            ),
          ),
        ],
      });

    const repository =
      new InMemoryDeveloperToolRepository([
        tool,
      ]);

    const service =
      new DeveloperToolService(
        repository,
      );

    const result =
      await service.publishTool(
        "tool-1",
        "owner-1",
      );

    const stored =
      await repository.findByIdForOwner(
        "tool-1",
        "owner-1",
      );

    expect(result.currentVersionId).toBe(
      "v-new",
    );
    expect(stored?.status).toBe(
      "published",
    );
    expect(stored?.currentVersionId).toBe(
      "v-new",
    );
  });

  it("rejects a release that belongs to another tool", async () => {
    const service =
      createService(
        createDraftTool({
          versions: [
            createUploadedVersion(
              "v1",
              "1.0.0",
              new Date(
                "2026-03-01T12:00:00.000Z",
              ),
            ),
          ],
        }),
      );

    await expect(
      service.setCurrentRelease(
        "tool-1",
        "owner-1",
        "version-from-another-tool",
      ),
    ).rejects.toThrow(
      "Selected release does not belong to this tool.",
    );
  });

  it("rejects an invalid current release", async () => {
    const service =
      createService(
        createDraftTool({
          versions: [
            {
              id: "v1",
              version: "1.0.0",
              fileKey: null,
              checksum: null,
              originalFileName: null,
              contentType: null,
              fileSizeBytes: null,
              isActive: true,
              createdAt: new Date(
                "2026-03-01T12:00:00.000Z",
              ),
            },
          ],
        }),
      );

    await expect(
      service.setCurrentRelease(
        "tool-1",
        "owner-1",
        "v1",
      ),
    ).rejects.toThrow(
      "Binary must be uploaded before publishing.",
    );
  });

  it("blocks mutations on archived tools", async () => {
    const service =
      createService(
        createDraftTool({
          status: "archived",
          versions: [
            createUploadedVersion(
              "v1",
              "1.0.0",
              new Date(
                "2026-03-01T12:00:00.000Z",
              ),
            ),
          ],
        }),
      );

    await expect(
      service.publishTool(
        "tool-1",
        "owner-1",
      ),
    ).rejects.toThrow(
      "Tool is archived.",
    );

    await expect(
      service.setCurrentRelease(
        "tool-1",
        "owner-1",
        "v1",
      ),
    ).rejects.toThrow(
      "Tool is archived.",
    );

    await expect(
      service.createVersion({
        toolId: "tool-1",
        ownerId: "owner-1",
        version: "1.0.1",
      }),
    ).rejects.toThrow(
      "Tool is archived.",
    );
  });

  it("allows a published tool to switch current release", async () => {
    const tool =
      createDraftTool({
        status: "published",
        currentVersionId: "v1",
        versions: [
          createUploadedVersion(
            "v1",
            "1.0.0",
            new Date(
              "2026-03-01T10:00:00.000Z",
            ),
          ),
          createUploadedVersion(
            "v2",
            "1.1.0",
            new Date(
              "2026-03-01T11:00:00.000Z",
            ),
          ),
        ],
      });

    const repository =
      new InMemoryDeveloperToolRepository([
        tool,
      ]);

    const service =
      new DeveloperToolService(
        repository,
      );

    const result =
      await service.setCurrentRelease(
        "tool-1",
        "owner-1",
        "v2",
      );

    const stored =
      await repository.findByIdForOwner(
        "tool-1",
        "owner-1",
      );

    expect(result.version).toBe(
      "1.1.0",
    );
    expect(stored?.currentVersionId).toBe(
      "v2",
    );
  });

  it("rejects publishing a tool that is already published", async () => {
    const service =
      createService(
        createDraftTool({
          status: "published",
          currentVersionId: "v1",
          versions: [
            createUploadedVersion(
              "v1",
              "1.0.0",
              new Date(
                "2026-03-01T12:00:00.000Z",
              ),
            ),
          ],
        }),
      );

    await expect(
      service.publishTool(
        "tool-1",
        "owner-1",
      ),
    ).rejects.toThrow(
      "Tool is already published.",
    );
  });
});
