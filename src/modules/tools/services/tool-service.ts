import {
  ToolError,
} from "../domain/tool-error";

import {
  isValidSha256,
} from "../domain/version-rules";

import type {
  ToolRepository,
} from "../repositories/tool-repository";

export class ToolService {
  constructor(
    private readonly repository: ToolRepository,
  ) {}

  async getTools() {
    return this.repository.findAll();
  }

  async searchTools(query: string) {
    return this.repository.search(query);
  }

  async getTool(slug: string) {
    return this.repository.findBySlug(slug);
  }

  async getPublicDownload(slug: string) {
    const download =
      await this.repository
        .findPublicDownloadBySlug(
          slug,
        );

    if (!download) {
      throw new ToolError(
        "Download is not available.",
      );
    }

    if (
      download.priceCents > 0
    ) {
      throw new ToolError(
        "Paid downloads are not available yet.",
      );
    }

    if (
      !isValidSha256(
        download.checksum,
      )
    ) {
      throw new ToolError(
        "Download is not available.",
      );
    }

    return download;
  }
}
