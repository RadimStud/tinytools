import { describe, expect, it } from "vitest";

import { InMemoryToolRepository } from "../repositories/in-memory-tool-repository";

import { ToolService } from "./tool-service";

describe("ToolService", () => {
  const service =
    new ToolService(
      new InMemoryToolRepository(),
    );

  it("returns only catalog tools from getTools", async () => {
    const tools =
      await service.getTools();

    expect(
      tools.map(
        (tool) => tool.slug,
      ),
    ).toEqual([
      "metadata-cleaner",
      "csv-cleaner",
    ]);
  });

  it("returns a published tool by slug", async () => {
    const tool =
      await service.getTool(
        "metadata-cleaner",
      );

    expect(tool?.name).toBe(
      "Metadata Cleaner",
    );
    expect(tool?.release?.version).toBe(
      "1.0.0",
    );
  });

  it("returns null for an unknown slug", async () => {
    await expect(
      service.getTool(
        "does-not-exist",
      ),
    ).resolves.toBeNull();
  });

  it("searches name, short description and full description", async () => {
    const byName =
      await service.searchTools(
        "csv",
      );

    const byDescription =
      await service.searchTools(
        "embedded metadata",
      );

    expect(
      byName.map(
        (tool) => tool.slug,
      ),
    ).toEqual([
      "csv-cleaner",
    ]);

    expect(
      byDescription.map(
        (tool) => tool.slug,
      ),
    ).toEqual([
      "metadata-cleaner",
    ]);
  });

  it("allows a free published download and blocks paid downloads", async () => {
    const freeDownload =
      await service.getPublicDownload(
        "metadata-cleaner",
      );

    expect(freeDownload.fileKey).toContain(
      "metadata-cleaner",
    );

    await expect(
      service.getPublicDownload(
        "csv-cleaner",
      ),
    ).rejects.toThrow(
      "Paid downloads are not available yet.",
    );
  });
});
