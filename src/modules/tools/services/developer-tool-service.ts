import type {
  ToolPlatform,
} from "../domain/tool";

import {
  ToolError,
} from "../domain/tool-error";

import {
  isReleasableVersion,
  isValidSemver,
  isValidSha256,
  latestReleasableVersion,
} from "../domain/version-rules";

import type {
  DeveloperToolDetail,
  DeveloperToolVersion,
} from "../domain/developer-tool-detail";

import type {
  DeveloperToolRepository,
} from "../repositories/developer-tool-repository";

function requireMutableTool(
  tool: DeveloperToolDetail,
) {
  if (
    tool.status ===
    "archived"
  ) {
    throw new ToolError(
      "Tool is archived.",
    );
  }
}

function requireOwnedVersion(
  tool: DeveloperToolDetail,
  versionId: string,
): DeveloperToolVersion {
  const version =
    tool.versions.find(
      (item) =>
        item.id ===
        versionId,
    );

  if (!version) {
    throw new ToolError(
      "Selected release does not belong to this tool.",
    );
  }

  return version;
}

function requireReleasableVersion(
  version: DeveloperToolVersion,
) {
  if (!version.isActive) {
    throw new ToolError(
      "Selected release must be active.",
    );
  }

  if (!version.fileKey) {
    throw new ToolError(
      "Binary must be uploaded before publishing.",
    );
  }

  if (
    !version.checksum ||
    !isValidSha256(
      version.checksum,
    )
  ) {
    throw new ToolError(
      "Checksum is invalid.",
    );
  }
}

export class DeveloperToolService {
  constructor(
    private readonly repository:
      DeveloperToolRepository,
  ) {}

  async getToolsForOwner(
    ownerId: string,
  ) {
    return this.repository
      .findByOwnerId(
        ownerId,
      );
  }

  async getToolForOwner(
    toolId: string,
    ownerId: string,
  ) {
    return this.repository
      .findByIdForOwner(
        toolId,
        ownerId,
      );
  }

  async updateTool(input: {
    toolId: string;
    ownerId: string;
    name: string;
    shortDescription: string;
    description: string;
    priceEuros: number;
    platforms: ToolPlatform[];
  }) {
    const tool =
      await this.requireTool(
        input.toolId,
        input.ownerId,
      );

    requireMutableTool(
      tool,
    );

    const name =
      input.name.trim();

    const shortDescription =
      input.shortDescription.trim();

    const description =
      input.description.trim();

    if (
      name.length < 2
    ) {
      throw new ToolError(
        "Tool name must have at least 2 characters.",
      );
    }

    if (
      shortDescription.length <
      10
    ) {
      throw new ToolError(
        "Short description must have at least 10 characters.",
      );
    }

    if (
      input.platforms.length === 0
    ) {
      throw new ToolError(
        "Select at least one platform.",
      );
    }

    if (
      !Number.isFinite(
        input.priceEuros,
      ) ||
      input.priceEuros < 0
    ) {
      throw new ToolError(
        "Price must be zero or greater.",
      );
    }

    const updated =
      await this.repository
        .updateForOwner({
          toolId:
            input.toolId,

          ownerId:
            input.ownerId,

          name,

          shortDescription,

          description:
            description.length > 0
              ? description
              : null,

          priceCents:
            Math.round(
              input.priceEuros *
                100,
            ),

          platforms:
            input.platforms,
        });

    if (!updated) {
      throw new ToolError(
        "Tool not found.",
      );
    }
  }

  async createVersion(input: {
    toolId: string;
    ownerId: string;
    version: string;
  }) {
    const tool =
      await this.requireTool(
        input.toolId,
        input.ownerId,
      );

    requireMutableTool(
      tool,
    );

    const version =
      input.version.trim();

    if (
      !isValidSemver(
        version,
      )
    ) {
      throw new ToolError(
        "Use a version such as 1.0.0 or 1.0.0-beta.1.",
      );
    }

    const created =
      await this.repository
        .createVersionForOwner({
          toolId:
            input.toolId,

          ownerId:
            input.ownerId,

          version,
        });

    if (!created) {
      throw new ToolError(
        "Tool not found.",
      );
    }
  }

  async attachVersionFile(input: {
    toolId: string;
    ownerId: string;
    versionId: string;
    fileKey: string;
    checksum: string;
    originalFileName?: string | null;
    contentType?: string | null;
    fileSizeBytes?: number | null;
  }) {
    const checksum =
      input.checksum
        .trim()
        .toLowerCase();

    if (
      !isValidSha256(
        checksum,
      )
    ) {
      throw new ToolError(
        "Checksum is invalid.",
      );
    }

    const fileKey =
      input.fileKey.trim();

    if (!fileKey) {
      throw new ToolError(
        "File key is required.",
      );
    }

    const tool =
      await this.requireTool(
        input.toolId,
        input.ownerId,
      );

    requireMutableTool(
      tool,
    );

    const version =
      tool.versions.find(
        (item) =>
          item.id ===
          input.versionId,
      );

    if (!version) {
      throw new ToolError(
        "Version not found.",
      );
    }

    if (version.fileKey) {
      throw new ToolError(
        "This version already has a binary.",
      );
    }

    const originalFileName =
      input.originalFileName
        ?.trim() ||
      null;

    const contentType =
      input.contentType
        ?.trim() ||
      null;

    const fileSizeBytes =
      typeof input.fileSizeBytes ===
        "number" &&
      Number.isFinite(
        input.fileSizeBytes,
      ) &&
      input.fileSizeBytes >= 0
        ? Math.round(
            input.fileSizeBytes,
          )
        : null;

    const attached =
      await this.repository
        .attachFileToVersionForOwner({
          toolId:
            input.toolId,

          ownerId:
            input.ownerId,

          versionId:
            input.versionId,

          fileKey,

          checksum,

          originalFileName,

          contentType,

          fileSizeBytes,
        });

    if (!attached) {
      throw new ToolError(
        "Could not attach binary to version.",
      );
    }
  }

  async publishTool(
    toolId: string,
    ownerId: string,
    versionId?: string,
  ) {
    const tool =
      await this.requireTool(
        toolId,
        ownerId,
      );

    if (
      tool.status ===
      "published"
    ) {
      throw new ToolError(
        "Tool is already published.",
      );
    }

    if (
      tool.status ===
      "archived"
    ) {
      throw new ToolError(
        "Tool is archived.",
      );
    }

    if (
      tool.status !==
      "draft"
    ) {
      throw new ToolError(
        "Only draft tools can be initially published.",
      );
    }

    if (
      tool.name.trim().length <
      2
    ) {
      throw new ToolError(
        "Tool name is incomplete.",
      );
    }

    if (
      tool.shortDescription
        .trim()
        .length < 10
    ) {
      throw new ToolError(
        "Short description must have at least 10 characters.",
      );
    }

    if (
      !tool.description ||
      tool.description
        .trim()
        .length < 20
    ) {
      throw new ToolError(
        "Add a full description with at least 20 characters before publishing.",
      );
    }

    if (
      tool.platforms.length ===
      0
    ) {
      throw new ToolError(
        "Select at least one platform before publishing.",
      );
    }

    const selectedVersion =
      versionId
        ? requireOwnedVersion(
            tool,
            versionId,
          )
        : latestReleasableVersion(
            tool.versions,
          );

    if (!selectedVersion) {
      throw new ToolError(
        "Binary must be uploaded before publishing.",
      );
    }

    requireReleasableVersion(
      selectedVersion,
    );

    const published =
      await this.repository
        .publishForOwner({
          toolId,
          ownerId,
          currentVersionId:
            selectedVersion.id,
        });

    if (!published) {
      throw new ToolError(
        "Could not publish tool.",
      );
    }

    return {
      slug:
        tool.slug,

      version:
        selectedVersion.version,

      currentVersionId:
        selectedVersion.id,
    };
  }

  async setCurrentRelease(
    toolId: string,
    ownerId: string,
    versionId: string,
  ) {
    const tool =
      await this.requireTool(
        toolId,
        ownerId,
      );

    requireMutableTool(
      tool,
    );

    const version =
      requireOwnedVersion(
        tool,
        versionId,
      );

    if (
      !isReleasableVersion(
        version,
      )
    ) {
      requireReleasableVersion(
        version,
      );
    }

    const updated =
      await this.repository
        .setCurrentReleaseForOwner({
          toolId,
          ownerId,
          versionId,
        });

    if (!updated) {
      throw new ToolError(
        "Tool not found.",
      );
    }

    return {
      slug:
        tool.slug,

      version:
        version.version,
    };
  }

  async archiveTool(
    toolId: string,
    ownerId: string,
  ) {
    const tool =
      await this.requireTool(
        toolId,
        ownerId,
      );

    if (
      tool.status ===
      "archived"
    ) {
      throw new ToolError(
        "Tool is archived.",
      );
    }

    const archived =
      await this.repository
        .archiveForOwner(
          toolId,
          ownerId,
        );

    if (!archived) {
      throw new ToolError(
        "Tool not found.",
      );
    }

    return {
      slug:
        tool.slug,
    };
  }

  private async requireTool(
    toolId: string,
    ownerId: string,
  ) {
    const tool =
      await this.repository
        .findByIdForOwner(
          toolId,
          ownerId,
        );

    if (!tool) {
      throw new ToolError(
        "Tool not found.",
      );
    }

    return tool;
  }
}
