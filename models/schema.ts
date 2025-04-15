// This file exports all schema definitions for drizzle-kit migrations
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { posts } from "./post.ts";

// Define actors table
export const actors = pgTable("actors", {
  id: uuid("id").primaryKey().defaultRandom(),
  preferredUsername: text("preferred_username").notNull().unique(),
  name: text("name"),
  summary: text("summary"),
  inbox: text("inbox").notNull(),
  outbox: text("outbox").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Export all schema tables
export { posts };
