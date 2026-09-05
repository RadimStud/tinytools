import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const toolStatusEnum =
  pgEnum(
    "tool_status",
    [
      "draft",
      "published",
      "archived",
    ],
  );

export const platformEnum =
  pgEnum(
    "tool_platform",
    [
      "windows",
      "macos",
      "linux",
    ],
  );

export const users = pgTable.withRLS(
  "users",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    authUserId:
      uuid("auth_user_id")
        .unique(),

    displayName:
      text("display_name")
        .notNull(),

    createdAt:
      timestamp(
        "created_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),
  },
);

export const tools = pgTable.withRLS(
  "tools",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    ownerId:
      uuid("owner_id")
        .references(
          () => users.id,
          {
            onDelete: "set null",
          },
        ),

    slug:
      text("slug")
        .notNull(),

    name:
      text("name")
        .notNull(),

    shortDescription:
      text(
        "short_description",
      )
        .notNull(),

    description:
      text("description"),

    priceCents:
      integer("price_cents")
        .notNull()
        .default(0),

    currency:
      text("currency")
        .notNull()
        .default("EUR"),

    status:
      toolStatusEnum("status")
        .notNull()
        .default("draft"),

    createdAt:
      timestamp(
        "created_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),

    updatedAt:
      timestamp(
        "updated_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),
  },
  (table) => [
    uniqueIndex(
      "tools_slug_unique",
    ).on(table.slug),
  ],
);

export const toolPlatforms =
  pgTable.withRLS(
    "tool_platforms",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      toolId:
        uuid("tool_id")
          .notNull()
          .references(
            () => tools.id,
            {
              onDelete:
                "cascade",
            },
          ),

      platform:
        platformEnum(
          "platform",
        )
          .notNull(),
    },
    (table) => [
      uniqueIndex(
        "tool_platform_unique",
      ).on(
        table.toolId,
        table.platform,
      ),
    ],
  );

export const toolVersions =
  pgTable.withRLS(
    "tool_versions",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      toolId:
        uuid("tool_id")
          .notNull()
          .references(
            () => tools.id,
            {
              onDelete:
                "cascade",
            },
          ),

      version:
        text("version")
          .notNull(),

      fileKey:
        text("file_key"),

      checksum:
        text("checksum"),

      isActive:
        boolean("is_active")
          .notNull()
          .default(true),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone:
              true,
          },
        )
          .defaultNow()
          .notNull(),
    },
  );

export const toolRequests =
  pgTable.withRLS(
    "tool_requests",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      requestedBy:
        uuid("requested_by")
          .references(
            () => users.id,
            {
              onDelete:
                "set null",
            },
          ),

      description:
        text("description")
          .notNull(),

      votes:
        integer("votes")
          .notNull()
          .default(1),

      bountyCents:
        integer(
          "bounty_cents",
        )
          .notNull()
          .default(0),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone:
              true,
          },
        )
          .defaultNow()
          .notNull(),
    },
  );
