// This file exports all schema definitions for drizzle-kit migrations

import { desc, isNull, type SQL, sql } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { Uuid } from "./uuid.ts";

const currentTimestamp = sql`CURRENT_TIMESTAMP`;

const accountStatusEnum = pgEnum("account_status", [
  "invited",
  "active",
  "suspended",
  "deleted",
]);

const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  intro: text("intro"),
  email: text("email").notNull().unique(),
  status: accountStatusEnum("status").notNull().default("invited"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
    .defaultNow(),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

// Define signup request state enum
const signupRequestStateEnum = pgEnum("signup_request_state", [
  "pending",
  "approved",
  "rejected",
  "completed",
]);

// Define signup_requests table
const signupRequests = pgTable("signup_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull(),
  intro: text("intro"),
  email: text("email").notNull(),
  state: signupRequestStateEnum("state").notNull().default("pending"),
  invitationAccountId: uuid("invitation_account_id").references(() =>
    accounts.id
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
    .defaultNow(),
});

const magicTokenTypeEnum = pgEnum("magic_token_type", [
  "signup",
  "signin",
]);

const magicLinks = pgTable("magic_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id),
  requestId: uuid("request_id").references(() => signupRequests.id),
  tokenHash: text("token_hash").notNull(),
  type: magicTokenTypeEnum("type").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
    .defaultNow(),
}, (table) => {
  return {
    // Partial unique index to ensure only one active signup token per request
    requestTokenIdx: uniqueIndex("request_token_idx").on(
      table.requestId,
      table.type,
    )
      .where(sql`consumed_at IS NULL AND type = 'signup'`),
  };
});

const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").notNull(),
  content: text("content").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull()
    .defaultNow(),
  iri: text("iri").unique().notNull(),
});

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

export type Actor = typeof actors.$inferSelect;
export type NewActor = typeof actors.$inferInsert;

const followings = pgTable(
  "following",
  {
    iri: text().notNull().primaryKey(),
    followerId: uuid("follower_id")
      .$type<Uuid>()
      .notNull()
      .references(() => actors.id, { onDelete: "cascade" }),
    followeeId: uuid("followee_id")
      .$type<Uuid>()
      .notNull()
      .references(() => actors.id, { onDelete: "cascade" }),
    accepted: timestamp({ withTimezone: true }),
    created: timestamp({ withTimezone: true })
      .notNull()
      .default(currentTimestamp),
  },
  (table) => [
    unique().on(table.followerId, table.followeeId),
    index().on(table.followerId),
  ],
);

export type Following = typeof followings.$inferSelect;
export type NewFollowing = typeof followings.$inferInsert;

// Export all schema tables
export {
  accounts,
  accountStatusEnum,
  followings,
  instances,
  magicLinks,
  magicTokenTypeEnum,
  posts,
  signupRequests,
  signupRequestStateEnum,
};
