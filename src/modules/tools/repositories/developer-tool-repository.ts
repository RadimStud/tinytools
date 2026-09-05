import type {
  DeveloperTool,
} from "../domain/developer-tool";

export interface DeveloperToolRepository {
  findByOwnerId(
    ownerId: string,
  ): Promise<DeveloperTool[]>;
}