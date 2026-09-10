export type UserRole =
  | "user"
  | "admin";

export type AppUser = {
  id: string;
  authUserId: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
};

export function isAdminUser(
  user: Pick<AppUser, "role">,
) {
  return user.role === "admin";
}
