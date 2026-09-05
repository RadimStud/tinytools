import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const tools = pgTable(
  "tools",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    slug: text("slug")
      .notNull()
      .unique(),

    name: text("name")
      .notNull(),

    shortDescription:
      text("short_description")
        .notNull(),

    priceCents:
      integer("price_cents")
        .notNull()
        .default(0),

    createdAt:
      timestamp("created_at", {
        withTimezone: true,
      })
        .defaultNow()
        .notNull(),
  },
);
