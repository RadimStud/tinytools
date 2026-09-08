export type ToolPlatform =
  | "windows"
  | "macos"
  | "linux";

export type ToolRelease = {
  version: string;
  checksum: string;
  createdAt: Date;
  originalFileName: string | null;
  fileSizeBytes: number | null;
};

export type Tool = {
  id: string;
  slug: string;
  name: string;

  shortDescription:
    string;

  description:
    string | null;

  platforms:
    ToolPlatform[];

  priceCents:
    number;

  currency:
    "EUR";

  release:
    ToolRelease | null;
};

export type PublicToolDownload = {
  slug: string;
  priceCents: number;
  fileKey: string;
  checksum: string;
  originalFileName: string | null;
  contentType: string | null;
  fileSizeBytes: number | null;
};
