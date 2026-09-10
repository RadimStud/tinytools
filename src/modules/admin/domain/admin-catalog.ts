export type AdminStats = {
  totalUsers: number;
  totalTools: number;
  publishedTools: number;
  draftTools: number;
  archivedTools: number;
};

export type AdminUserListItem = {
  id: string;
  displayName: string;
  role: "user" | "admin";
  createdAt: Date;
};

export type AdminToolListItem = {
  id: string;
  name: string;
  slug: string;
  status:
    | "draft"
    | "published"
    | "archived";
  ownerDisplayName:
    string | null;
  currentReleaseVersion:
    string | null;
  createdAt: Date;
  updatedAt: Date;
};
