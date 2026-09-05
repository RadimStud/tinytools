export type DeveloperToolStatus =
  | "draft"
  | "published"
  | "archived";

export type DeveloperTool = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  priceCents: number;
  status: DeveloperToolStatus;
  createdAt: Date;
};