export type ToolPlatform =
  | "windows"
  | "macos"
  | "linux";

export type Tool = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  platforms: ToolPlatform[];
  priceCents: number;
  currency: "EUR";
};
