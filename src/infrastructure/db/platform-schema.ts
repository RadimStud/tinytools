import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./schema";

export const platformApps = pgTable.withRLS("platform_apps", {
  appId: text("app_id").primaryKey(), name: text("name").notNull(), description: text("description").notNull(),
  state: text("state").notNull(), internalPath: text("internal_path"), accessMode: text("access_mode").notNull(),
  contractVersion: text("contract_version").notNull().default("1.0"),
}, table => [
  check("platform_apps_app_id_check", sql`${table.appId} ~ '^[a-z][a-z0-9-]{0,47}$'`),
  check("platform_apps_state_check", sql`${table.state} IN ('available','coming_soon','unavailable')`),
  check("platform_apps_access_mode_check", sql`${table.accessMode} IN ('explicit','public_free','authenticated_free')`),
]);
export const platformAdmins = pgTable.withRLS("platform_admins", {
  authUserId: uuid("auth_user_id").primaryKey().references(() => users.authUserId, { onDelete: "restrict" }),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  reason: text("reason").notNull(),
}, table => [check("platform_admins_reason_check", sql`length(${table.reason}) BETWEEN 5 AND 500`)]);
export const appAccess = pgTable.withRLS("app_access", {
  authUserId: uuid("auth_user_id").notNull().references(() => users.authUserId, { onDelete: "restrict" }),
  appId: text("app_id").notNull().references(() => platformApps.appId, { onDelete: "restrict" }),
  status: text("status").notNull(), appRole: text("app_role").notNull(), policyVersion: integer("policy_version").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  changedBy: uuid("changed_by").notNull().references(() => users.authUserId, { onDelete: "restrict" }),
}, table => [
  primaryKey({ columns: [table.authUserId, table.appId] }),
  index("app_access_app_status_idx").on(table.appId, table.status),
  check("app_access_status_check", sql`${table.status} IN ('enabled','suspended','revoked')`),
  check("app_access_app_role_check", sql`${table.appRole} IN ('user','app_admin')`),
  check("app_access_policy_version_check", sql`${table.policyVersion} > 0`),
]);
export const adminAuditEvents = pgTable.withRLS("admin_audit_events", {
  requestId: uuid("request_id").primaryKey(),
  actorAuthUserId: uuid("actor_auth_user_id").notNull().references(() => users.authUserId, { onDelete: "restrict" }),
  targetAuthUserId: uuid("target_auth_user_id").references(() => users.authUserId, { onDelete: "restrict" }),
  appId: text("app_id").references(() => platformApps.appId, { onDelete: "restrict" }),
  action: text("action").notNull(), outcome: text("outcome").notNull(), reason: text("reason").notNull(),
  beforeState: jsonb("before_state"), afterState: jsonb("after_state"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("admin_audit_events_created_idx").on(table.createdAt.desc()),
  check("admin_audit_events_outcome_check", sql`${table.outcome} IN ('success','denied','conflict')`),
  check("admin_audit_events_reason_check", sql`length(${table.reason}) BETWEEN 5 AND 500`),
]);

export const gatewayRateWindows = pgTable.withRLS("gateway_rate_windows", {
  authUserId: uuid("auth_user_id").notNull().references(() => users.authUserId, { onDelete: "cascade" }),
  minute: timestamp("minute", { withTimezone: true }).notNull(),
  hits: integer("hits").notNull(),
}, table => [primaryKey({ columns: [table.authUserId, table.minute] }),
  check("gateway_rate_windows_hits_check", sql`${table.hits} BETWEEN 1 AND 60`),
  index("gateway_rate_windows_expiry").on(table.minute),
]);
