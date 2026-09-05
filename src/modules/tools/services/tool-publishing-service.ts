import type {
  ToolPlatform,
} from "../domain/tool";

import type {
  ToolPublishingRepository,
} from "../repositories/tool-publishing-repository";

type CreateDraftInput = {
  ownerId: string;
  name: string;
  shortDescription: string;
  priceEuros: number;
  platforms: ToolPlatform[];
};

function slugify(
  value: string,
) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

export class ToolPublishingService {
  constructor(
    private readonly repository:
      ToolPublishingRepository,
  ) {}

  async createDraft(
    input: CreateDraftInput,
  ) {
    const name =
      input.name.trim();

    const shortDescription =
      input.shortDescription
        .trim();

    if (
      name.length < 2
    ) {
      throw new Error(
        "Tool name is too short.",
      );
    }

    if (
      shortDescription.length <
      10
    ) {
      throw new Error(
        "Description is too short.",
      );
    }

    if (
      input.platforms.length ===
      0
    ) {
      throw new Error(
        "Select at least one platform.",
      );
    }

    const baseSlug =
      slugify(name);

    if (!baseSlug) {
      throw new Error(
        "Could not generate tool slug.",
      );
    }

    const slug =
      `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

    const priceCents =
      Math.max(
        0,
        Math.round(
          input.priceEuros *
            100,
        ),
      );

    return this.repository
      .createDraft({
        ownerId:
          input.ownerId,

        name,

        slug,

        shortDescription,

        priceCents,

        platforms:
          input.platforms,
      });
  }
}