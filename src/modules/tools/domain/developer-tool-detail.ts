import type {
  ToolPlatform,
} from "./tool";

export type DeveloperToolStatus =
  | "draft"
  | "published"
  | "archived";

export type DeveloperToolVersion = {
  id: string;
  version: string;
  fileKey: string | null;
  checksum: string | null;
  isActive: boolean;
  createdAt: Date;
};

export type DeveloperToolDetail = {
  id: string;
  ownerId: string | null;
  slug: string;
  name: string;
  shortDescription: string;
  description: string | null;
  priceCents: number;
  currency: string;
  status: DeveloperToolStatus;
  platforms: ToolPlatform[];
  versions: DeveloperToolVersion[];
  createdAt: Date;
  updatedAt: Date;
};