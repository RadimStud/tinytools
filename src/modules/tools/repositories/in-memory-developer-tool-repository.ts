import type {
  DeveloperTool,
} from "../domain/developer-tool";

import type {
  DeveloperToolDetail,
  DeveloperToolVersion,
} from "../domain/developer-tool-detail";

import {
  ToolError,
} from "../domain/tool-error";

import type {
  AttachDeveloperToolVersionFileInput,
  CreateDeveloperToolVersionInput,
  PublishDeveloperToolInput,
  SetCurrentReleaseInput,
  UpdateDeveloperToolInput,
} from "../domain/developer-tool-management";

import type {
  DeveloperToolRepository,
} from "./developer-tool-repository";

function cloneTool(
  tool: DeveloperToolDetail,
): DeveloperToolDetail {
  return {
    ...tool,
    platforms: [...tool.platforms],
    versions: tool.versions.map(
      (version) => ({
        ...version,
      }),
    ),
  };
}

export class InMemoryDeveloperToolRepository
  implements DeveloperToolRepository
{
  constructor(
    private readonly tools: DeveloperToolDetail[] = [],
  ) {}

  async findByOwnerId(
    ownerId: string,
  ): Promise<DeveloperTool[]> {
    return this.tools
      .filter(
        (tool) =>
          tool.ownerId ===
          ownerId,
      )
      .map((tool) => ({
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        shortDescription:
          tool.shortDescription,
        priceCents:
          tool.priceCents,
        status: tool.status,
        createdAt:
          tool.createdAt,
      }));
  }

  async findByIdForOwner(
    toolId: string,
    ownerId: string,
  ): Promise<DeveloperToolDetail | null> {
    const tool =
      this.tools.find(
        (item) =>
          item.id ===
            toolId &&
          item.ownerId ===
            ownerId,
      );

    return tool
      ? cloneTool(tool)
      : null;
  }

  async updateForOwner(
    input: UpdateDeveloperToolInput,
  ): Promise<boolean> {
    const tool =
      this.findMutable(
        input.toolId,
        input.ownerId,
      );

    if (!tool) {
      return false;
    }

    tool.name = input.name;
    tool.shortDescription =
      input.shortDescription;
    tool.description =
      input.description;
    tool.priceCents =
      input.priceCents;
    tool.platforms = [
      ...input.platforms,
    ];
    tool.updatedAt =
      new Date();

    return true;
  }

  async createVersionForOwner(
    input: CreateDeveloperToolVersionInput,
  ): Promise<boolean> {
    const tool =
      this.findMutable(
        input.toolId,
        input.ownerId,
      );

    if (!tool) {
      return false;
    }

    const exists =
      tool.versions.some(
        (version) =>
          version.version ===
          input.version,
      );

    if (exists) {
      throw new ToolError(
        "Version already exists.",
      );
    }

    const version: DeveloperToolVersion = {
      id: crypto.randomUUID(),
      version: input.version,
      fileKey: null,
      checksum: null,
      originalFileName: null,
      contentType: null,
      fileSizeBytes: null,
      isActive: true,
      createdAt: new Date(),
    };

    tool.versions.push(
      version,
    );
    tool.updatedAt =
      new Date();

    return true;
  }

  async attachFileToVersionForOwner(
    input: AttachDeveloperToolVersionFileInput,
  ): Promise<boolean> {
    const tool =
      this.findMutable(
        input.toolId,
        input.ownerId,
      );

    if (!tool) {
      return false;
    }

    const version =
      tool.versions.find(
        (item) =>
          item.id ===
          input.versionId,
      );

    if (!version) {
      return false;
    }

    version.fileKey =
      input.fileKey;
    version.checksum =
      input.checksum;
    version.originalFileName =
      input.originalFileName;
    version.contentType =
      input.contentType;
    version.fileSizeBytes =
      input.fileSizeBytes;
    tool.updatedAt =
      new Date();

    return true;
  }

  async publishForOwner(
    input: PublishDeveloperToolInput,
  ): Promise<boolean> {
    const tool =
      this.findMutable(
        input.toolId,
        input.ownerId,
      );

    if (
      !tool ||
      tool.status !== "draft"
    ) {
      return false;
    }

    tool.status = "published";
    tool.currentVersionId =
      input.currentVersionId;
    tool.updatedAt =
      new Date();

    return true;
  }

  async setCurrentReleaseForOwner(
    input: SetCurrentReleaseInput,
  ): Promise<boolean> {
    const tool =
      this.findMutable(
        input.toolId,
        input.ownerId,
      );

    if (!tool) {
      return false;
    }

    tool.currentVersionId =
      input.versionId;
    tool.updatedAt =
      new Date();

    return true;
  }

  async archiveForOwner(
    toolId: string,
    ownerId: string,
  ): Promise<boolean> {
    const tool =
      this.findMutable(
        toolId,
        ownerId,
      );

    if (!tool) {
      return false;
    }

    tool.status = "archived";
    tool.updatedAt =
      new Date();

    return true;
  }

  private findMutable(
    toolId: string,
    ownerId: string,
  ) {
    return this.tools.find(
      (item) =>
        item.id === toolId &&
        item.ownerId ===
          ownerId,
    );
  }
}
