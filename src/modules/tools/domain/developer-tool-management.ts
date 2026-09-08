import type {
  ToolPlatform,
} from "./tool";

export type UpdateDeveloperToolInput = {
  toolId: string;
  ownerId: string;
  name: string;
  shortDescription: string;
  description: string | null;
  priceCents: number;
  platforms: ToolPlatform[];
};

export type CreateDeveloperToolVersionInput = {
  toolId: string;
  ownerId: string;
  version: string;
};

export type AttachDeveloperToolVersionFileInput = {
  toolId: string;
  ownerId: string;
  versionId: string;
  fileKey: string;
  checksum: string;
  originalFileName: string | null;
  contentType: string | null;
  fileSizeBytes: number | null;
};

export type PublishDeveloperToolInput = {
  toolId: string;
  ownerId: string;
  currentVersionId: string;
};

export type SetCurrentReleaseInput = {
  toolId: string;
  ownerId: string;
  versionId: string;
};
