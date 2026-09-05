import type { Tool } from "../domain/tool";

export interface ToolRepository {
  findAll(): Promise<Tool[]>;

  findBySlug(
    slug: string,
  ): Promise<Tool | null>;

  search(
    query: string,
  ): Promise<Tool[]>;
}
