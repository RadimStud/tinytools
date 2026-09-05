import type {
  DeveloperToolRepository,
} from "../repositories/developer-tool-repository";

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
}