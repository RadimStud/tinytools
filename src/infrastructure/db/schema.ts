import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
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

export const userRoleEnum =
  pgEnum(
    "user_role",
    [
      "user",
      "admin",
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

    role:
      userRoleEnum("role")
        .notNull()
        .default("user"),

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

    currentVersionId:
      uuid(
        "current_version_id",
      )
        .references(
          (): AnyPgColumn =>
            toolVersions.id,
          {
            onDelete:
              "restrict",
          },
        ),

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

      originalFileName:
        text(
          "original_file_name",
        ),

      contentType:
        text("content_type"),

      fileSizeBytes:
        integer(
          "file_size_bytes",
        ),

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
    (table) => [
      uniqueIndex(
        "tool_versions_tool_id_version_unique",
      ).on(
        table.toolId,
        table.version,
      ),

      uniqueIndex(
        "tool_versions_id_tool_id_unique",
      ).on(
        table.id,
        table.toolId,
      ),
    ],
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


export const superuserPermissions = pgTable.withRLS("superuser_permissions", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [check("superuser_single_owner", sql`${table.userId} = '2e954c50-23d5-4e68-be4c-ff9a61a697ad'::uuid`)]);

export const vaultFiles = pgTable.withRLS("vault_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  fileKey: text("file_key").notNull().unique(),
  sizeBytes: integer("size_bytes").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check("vault_files_size_bytes_check", sql`${table.sizeBytes} > 0 AND ${table.sizeBytes} <= 262144000`),
  check("vault_files_status_check", sql`${table.status} IN ('pending', 'ready', 'deleted')`),
  index("vault_files_owner_created_idx").on(table.ownerId, table.createdAt.desc()),
]);
