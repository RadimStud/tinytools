import {
  eq,
} from "drizzle-orm";

import { db } from "../src/infrastructure/db/db";

import {
  toolPlatforms,
  tools,
} from "../src/infrastructure/db/schema";

async function seed() {
  const existing =
    await db
      .select()
      .from(tools)
      .where(
        eq(
          tools.slug,
          "metadata-cleaner",
        ),
      );

  if (
    existing.length > 0
  ) {
    console.log(
      "Seed already exists.",
    );

    process.exit(0);
  }

  const inserted =
    await db
      .insert(tools)
      .values([
        {
          slug:
            "metadata-cleaner",

          name:
            "Metadata Cleaner",

          shortDescription:
            "Remove EXIF and GPS metadata from photos.",

          priceCents:
            390,

          currency:
            "EUR",

          status:
            "published",
        },

        {
          slug:
            "csv-cleaner",

          name:
            "CSV Cleaner",

          shortDescription:
            "Clean and normalize messy CSV files.",

          priceCents:
            290,

          currency:
            "EUR",

          status:
            "published",
        },
      ])
      .returning();

  for (
    const tool of inserted
  ) {
    await db
      .insert(
        toolPlatforms,
      )
      .values([
        {
          toolId:
            tool.id,

          platform:
            "windows",
        },

        {
          toolId:
            tool.id,

          platform:
            "macos",
        },
      ]);
  }

  console.log(
    "Seed completed.",
  );

  process.exit(0);
}

seed().catch(
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
