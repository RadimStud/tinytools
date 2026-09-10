import type {
  AdminStats,
  AdminToolListItem,
  AdminUserListItem,
} from "../domain/admin-catalog";

import type {
  AdminRepository,
} from "./admin-repository";

type StoredAdminTool =
  AdminToolListItem;

export class InMemoryAdminRepository
  implements AdminRepository
{
  constructor(
    private readonly users: AdminUserListItem[] = [],
    private readonly tools: StoredAdminTool[] = [],
  ) {}

  async getStats():
    Promise<AdminStats> {
    return {
      totalUsers:
        this.users.length,

      totalTools:
        this.tools.length,

      publishedTools:
        this.tools.filter(
          (tool) =>
            tool.status ===
            "published",
        ).length,

      draftTools:
        this.tools.filter(
          (tool) =>
            tool.status ===
            "draft",
        ).length,

      archivedTools:
        this.tools.filter(
          (tool) =>
            tool.status ===
            "archived",
        ).length,
    };
  }

  async listUsers(): Promise<
    AdminUserListItem[]
  > {
    return this.users
      .slice()
      .sort(
        (left, right) =>
          right.createdAt.getTime() -
          left.createdAt.getTime(),
      );
  }

  async listTools(): Promise<
    AdminToolListItem[]
  > {
    return this.tools
      .slice()
      .sort(
        (left, right) =>
          right.updatedAt.getTime() -
          left.updatedAt.getTime(),
      );
  }
}
