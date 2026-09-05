import type { Tool } from "../domain/tool";
import type { ToolRepository } from "./tool-repository";

const tools: Tool[] = [
  {
    id: "metadata-cleaner",
    slug: "metadata-cleaner",
    name: "Metadata Cleaner",
    shortDescription:
      "Remove EXIF and GPS metadata from photos.",
    platforms: ["windows", "macos"],
    priceCents: 390,
    currency: "EUR",
  },
  {
    id: "csv-cleaner",
    slug: "csv-cleaner",
    name: "CSV Cleaner",
    shortDescription:
      "Clean and normalize messy CSV files.",
    platforms: ["windows", "macos"],
    priceCents: 290,
    currency: "EUR",
  },
];

export class InMemoryToolRepository
  implements ToolRepository
{
  async findAll(): Promise<Tool[]> {
    return tools;
  }

  async findBySlug(
    slug: string,
  ): Promise<Tool | null> {
    return (
      tools.find(
        (tool) => tool.slug === slug,
      ) ?? null
    );
  }

  async search(
    query: string,
  ): Promise<Tool[]> {
    const normalized =
      query.trim().toLowerCase();

    if (!normalized) {
      return tools;
    }

    return tools.filter((tool) => {
      return (
        tool.name
          .toLowerCase()
          .includes(normalized) ||
        tool.shortDescription
          .toLowerCase()
          .includes(normalized)
      );
    });
  }
}
