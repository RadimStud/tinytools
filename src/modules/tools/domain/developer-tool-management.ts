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
};