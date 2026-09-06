import type {
  DeveloperTool,
} from "../domain/developer-tool";

import type {
  DeveloperToolDetail,
} from "../domain/developer-tool-detail";

import type {
  AttachDeveloperToolVersionFileInput,
  CreateDeveloperToolVersionInput,
  UpdateDeveloperToolInput,
} from "../domain/developer-tool-management";

export interface DeveloperToolRepository {
  findByOwnerId(
    ownerId: string,
  ): Promise<DeveloperTool[]>;

  findByIdForOwner(
    toolId: string,
    ownerId: string,
  ): Promise<DeveloperToolDetail | null>;

  updateForOwner(
    input: UpdateDeveloperToolInput,
  ): Promise<boolean>;

  createVersionForOwner(
    input: CreateDeveloperToolVersionInput,
  ): Promise<boolean>;

  attachFileToVersionForOwner(
    input: AttachDeveloperToolVersionFileInput,
  ): Promise<boolean>;

  publishForOwner(
    toolId: string,
    ownerId: string,
  ): Promise<boolean>;

  archiveForOwner(
    toolId: string,
    ownerId: string,
  ): Promise<boolean>;
}