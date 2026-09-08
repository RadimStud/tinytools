import type {
  PublicToolDownload,
  Tool,
} from "../domain/tool";

import type {
  ToolRepository,
} from "./tool-repository";

type StoredTool = Tool & {
  status:
    | "draft"
    | "published"
    | "archived";

  fileKey:
    string | null;

  contentType:
    string | null;
};

const tools: StoredTool[] = [
  {
    id:
      "tool-metadata-cleaner",

    slug:
      "metadata-cleaner",

    name:
      "Metadata Cleaner",

    shortDescription:
      "Remove metadata from files locally.",

    description:
      "Remove embedded metadata from files locally without uploading them to a third-party service.",

    platforms: [
      "windows",
      "macos",
    ],

    priceCents:
      0,

    currency:
      "EUR",

    status:
      "published",

    fileKey:
      "tools/tool-metadata-cleaner/1.0.0/metadata-cleaner.exe",

    contentType:
      "application/octet-stream",

    release: {
      version:
        "1.0.0",

      checksum:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

      createdAt:
        new Date(
          "2026-01-01T00:00:00.000Z",
        ),

      originalFileName:
        "metadata-cleaner.exe",

      fileSizeBytes:
        1024,
    },
  },

  {
    id:
      "tool-csv-cleaner",

    slug:
      "csv-cleaner",

    name:
      "CSV Cleaner",

    shortDescription:
      "Clean and normalize CSV files.",

    description:
      "Clean, normalize and prepare CSV files with a small focused local utility.",

    platforms: [
      "windows",
      "macos",
    ],

    priceCents:
      500,

    currency:
      "EUR",

    status:
      "published",

    fileKey:
      "tools/tool-csv-cleaner/1.0.0/csv-cleaner.exe",

    contentType:
      "application/octet-stream",

    release: {
      version:
        "1.0.0",

      checksum:
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",

      createdAt:
        new Date(
          "2026-01-02T00:00:00.000Z",
        ),

      originalFileName:
        "csv-cleaner.exe",

      fileSizeBytes:
        2048,
    },
  },
];

function toPublicTool(
  tool: StoredTool,
): Tool {
  const {
    status,
    fileKey,
    contentType,
    ...publicTool
  } = tool;

  void status;
  void fileKey;
  void contentType;

  return publicTool;
}

function publishedTools() {
  return tools.filter(
    (tool) =>
      tool.status ===
      "published",
  );
}

export class InMemoryToolRepository
  implements ToolRepository
{
  async findAll() {
    return publishedTools().map(
      toPublicTool,
    );
  }

  async findBySlug(
    slug: string,
  ) {
    const tool =
      publishedTools().find(
        (item) =>
          item.slug === slug,
      );

    return tool
      ? toPublicTool(tool)
      : null;
  }

  async search(
    query: string,
  ) {
    const normalized =
      query
        .trim()
        .toLowerCase();

    const catalog =
      publishedTools();

    if (!normalized) {
      return catalog.map(
        toPublicTool,
      );
    }

    return catalog
      .filter(
        (tool) =>
          tool.name
            .toLowerCase()
            .includes(
              normalized,
            ) ||
          tool.shortDescription
            .toLowerCase()
            .includes(
              normalized,
            ) ||
          (
            tool.description ??
            ""
          )
            .toLowerCase()
            .includes(
              normalized,
            ),
      )
      .map(toPublicTool);
  }

  async findPublicDownloadBySlug(
    slug: string,
  ): Promise<PublicToolDownload | null> {
    const tool =
      publishedTools().find(
        (item) =>
          item.slug === slug,
      );

    if (
      !tool ||
      !tool.release ||
      !tool.fileKey
    ) {
      return null;
    }

    return {
      slug:
        tool.slug,

      priceCents:
        tool.priceCents,

      fileKey:
        tool.fileKey,

      checksum:
        tool.release.checksum,

      originalFileName:
        tool.release.originalFileName,

      contentType:
        tool.contentType,

      fileSizeBytes:
        tool.release.fileSizeBytes,
    };
  }
}
