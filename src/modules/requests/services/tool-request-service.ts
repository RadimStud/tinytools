import type {
  ToolRequestRepository,
} from "../repositories/tool-request-repository";

export class ToolRequestService {
  constructor(
    private readonly repository:
      ToolRequestRepository,
  ) {}

  async createRequest(
    description: string,
  ) {
    const normalized =
      description.trim();

    if (
      normalized.length < 10
    ) {
      throw new Error(
        "Describe the problem in at least 10 characters.",
      );
    }

    if (
      normalized.length > 1000
    ) {
      throw new Error(
        "Description is too long.",
      );
    }

    return this.repository.create({
      description:
        normalized,
    });
  }
}