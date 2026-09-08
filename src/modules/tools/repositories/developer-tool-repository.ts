import type {
  DeveloperTool,
} from "../domain/developer-tool";

import type {
  DeveloperToolDetail,
} from "../domain/developer-tool-detail";

import type {
  AttachDeveloperToolVersionFileInput,
  CreateDeveloperToolVersionInput,
  PublishDeveloperToolInput,
  SetCurrentReleaseInput,
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
    input: PublishDeveloperToolInput,
  ): Promise<boolean>;

  setCurrentReleaseForOwner(
    input: SetCurrentReleaseInput,
  ): Promise<boolean>;

  archiveForOwner(
    toolId: string,
    ownerId: string,
  ): Promise<boolean>;
}
