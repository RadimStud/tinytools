import type {
  ToolPlatform,
} from "../domain/tool";

export type PublishToolInput = {
  name: string;
  slug: string;
  shortDescription: string;
  priceCents: number;
  platforms: ToolPlatform[];
};

export interface ToolPublishingRepository {
  createDraft(
    input: PublishToolInput,
  ): Promise<{
    id: string;
    slug: string;
  }>;
}