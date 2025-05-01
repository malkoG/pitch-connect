// This file exports all schema definitions for drizzle-kit migrations

import { desc, isNull, type SQL, sql } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  check,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { posts } from "./post.ts";
import { accounts, accountStatusEnum } from "../db/schema/account.ts";
import { signupRequests, signupRequestStateEnum } from "../db/schema/signup.ts";
import { magicLinks, magicTokenTypeEnum } from "../db/schema/magic_link.ts";
import { Uuid } from "./uuid.ts";

const currentTimestamp = sql`CURRENT_TIMESTAMP`;

const instances = pgTable(
  "instance",
  {
    host: text().primaryKey(),
    software: text(),
    softwareVersion: text("software_version"),
    updated: timestamp({ withTimezone: true })
      .notNull()
      .default(currentTimestamp),
    created: timestamp({ withTimezone: true })
      .notNull()
      .default(currentTimestamp),
  },
  (table) => [
    check(
      "instance_host_check",
      sql`${table.host} NOT LIKE '%@%'`,
    ),
  ],
);

export type Instance = typeof instances.$inferSelect;
export type NewInstance = typeof instances.$inferInsert;

export const actorTypeEnum = pgEnum("actor_type", [
  "Application",
  "Group",
  "Organization",
  "Person",
  "Service",
]);

// Define actors table
export const actors = pgTable(
  "actors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    iri: text().notNull().unique(),
    type: actorTypeEnum().notNull(),
    username: text().notNull(),
    instanceHost: text("instance_host")
      .notNull()
      .references(() => instances.host),
    handleHost: text("handle_host").notNull(),
    handle: text().notNull().generatedAlwaysAs((): SQL =>
      sql`'@' || ${actors.username} || '@' || ${actors.handleHost}`
    ),
    accountId: uuid("account_id")
      .$type<Uuid>()
      .unique()
      .references(() => accounts.id, { onDelete: "cascade" }),
    name: text("name"),
    bioHtml: text("bio_html"),
    preferredUsername: text("preferred_username").notNull().unique(),
    vatarUrl: text("avatar_url"),
    headerUrl: text("header_url"),
    inboxUrl: text("inbox_url").notNull(),
    sharedInboxUrl: text("shared_inbox_url"),
    followersUrl: text("followers_url"),
    featuredUrl: text("featured_url"),
    fieldHtmls: json("field_htmls")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    summary: text("summary"),
    inbox: text("inbox").notNull(),
    outbox: text("outbox").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull()
      .defaultNow(),
    sensitive: boolean().notNull().default(false),
    successorId: uuid("successor_id")
      .$type<Uuid>()
      .references((): AnyPgColumn => actors.id, { onDelete: "set null" }),
    aliases: text().array().notNull().default(sql`(ARRAY[]::text[])`),
    followeesCount: integer("followees_count").notNull().default(0),
    followersCount: integer("followers_count").notNull().default(0),
    postsCount: integer("posts_count").notNull().default(0),
    url: text(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .default(currentTimestamp),
    publishedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    unique().on(table.username, table.instanceHost),
    check("actor_username_check", sql`${table.username} NOT LIKE '%@%'`),
  ],
);

// Export all schema tables
export {
  accounts,
  accountStatusEnum,
  instances,
  magicLinks,
  magicTokenTypeEnum,
  posts,
  signupRequests,
  signupRequestStateEnum,
};
