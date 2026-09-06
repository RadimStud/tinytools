import type {
  ToolPlatform,
} from "../domain/tool";

import type {
  DeveloperToolRepository,
} from "../repositories/developer-tool-repository";

const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;

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
    const name =
      input.name.trim();

    const shortDescription =
      input.shortDescription.trim();

    const description =
      input.description.trim();

    if (
      name.length < 2
    ) {
      throw new Error(
        "Tool name must have at least 2 characters.",
      );
    }

    if (
      shortDescription.length <
      10
    ) {
      throw new Error(
        "Short description must have at least 10 characters.",
      );
    }

    if (
      input.platforms.length === 0
    ) {
      throw new Error(
        "Select at least one platform.",
      );
    }

    if (
      !Number.isFinite(
        input.priceEuros,
      ) ||
      input.priceEuros < 0
    ) {
      throw new Error(
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
      throw new Error(
        "Tool not found.",
      );
    }
  }

  async createVersion(input: {
    toolId: string;
    ownerId: string;
    version: string;
  }) {
    const version =
      input.version.trim();

    if (
      !semverPattern.test(
        version,
      )
    ) {
      throw new Error(
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
      throw new Error(
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
  }) {
    const checksum =
      input.checksum
        .trim()
        .toLowerCase();

    if (
      !/^[a-f0-9]{64}$/.test(
        checksum,
      )
    ) {
      throw new Error(
        "Invalid SHA-256 checksum.",
      );
    }

    const fileKey =
      input.fileKey.trim();

    if (!fileKey) {
      throw new Error(
        "File key is required.",
      );
    }

    const tool =
      await this.repository
        .findByIdForOwner(
          input.toolId,
          input.ownerId,
        );

    if (!tool) {
      throw new Error(
        "Tool not found.",
      );
    }

    const version =
      tool.versions.find(
        (item) =>
          item.id ===
          input.versionId,
      );

    if (!version) {
      throw new Error(
        "Version not found.",
      );
    }

    if (version.fileKey) {
      throw new Error(
        "This version already has a binary.",
      );
    }

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
        });

    if (!attached) {
      throw new Error(
        "Could not attach binary to version.",
      );
    }
  }
  async publishTool(
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
      throw new Error(
        "Tool not found.",
      );
    }

    if (
      tool.status ===
      "published"
    ) {
      throw new Error(
        "Tool is already published.",
      );
    }

    if (
      tool.status ===
      "archived"
    ) {
      throw new Error(
        "Archived tool cannot be published.",
      );
    }

    if (
      tool.name.trim().length <
      2
    ) {
      throw new Error(
        "Tool name is incomplete.",
      );
    }

    if (
      tool.shortDescription
        .trim()
        .length < 10
    ) {
      throw new Error(
        "Short description must have at least 10 characters.",
      );
    }

    if (
      !tool.description ||
      tool.description
        .trim()
        .length < 20
    ) {
      throw new Error(
        "Add a full description with at least 20 characters before publishing.",
      );
    }

    if (
      tool.platforms.length ===
      0
    ) {
      throw new Error(
        "Select at least one platform before publishing.",
      );
    }

    const releasableVersion =
      tool.versions.find(
        (version) =>
          version.isActive &&
          Boolean(
            version.fileKey,
          ) &&
          Boolean(
            version.checksum,
          ) &&
          /^[a-f0-9]{64}$/i.test(
            version.checksum ??
              "",
          ),
      );

    if (!releasableVersion) {
      throw new Error(
        "Upload a binary with a valid SHA-256 checksum to at least one active version before publishing.",
      );
    }

    const published =
      await this.repository
        .publishForOwner(
          toolId,
          ownerId,
        );

    if (!published) {
      throw new Error(
        "Could not publish tool.",
      );
    }

    return {
      slug:
        tool.slug,

      version:
        releasableVersion.version,
    };
  }

  async archiveTool(
    toolId: string,
    ownerId: string,
  ) {
    const archived =
      await this.repository
        .archiveForOwner(
          toolId,
          ownerId,
        );

    if (!archived) {
      throw new Error(
        "Tool not found.",
      );
    }
  }
}