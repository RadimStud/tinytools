import type { ToolRepository } from "../repositories/tool-repository";

export class ToolService {
  constructor(
    private readonly repository: ToolRepository,
  ) {}

  async getTools() {
    return this.repository.findAll();
  }

  async searchTools(query: string) {
    return this.repository.search(query);
  }

  async getTool(slug: string) {
    return this.repository.findBySlug(slug);
  }
}
