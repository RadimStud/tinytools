import type {
  AdminStats,
  AdminToolListItem,
  AdminUserListItem,
} from "../domain/admin-catalog";

export interface AdminRepository {
  getStats(): Promise<AdminStats>;

  listUsers(): Promise<
    AdminUserListItem[]
  >;

  listTools(): Promise<
    AdminToolListItem[]
  >;
}
