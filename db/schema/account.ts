import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

// Define account status enum
export const accountStatusEnum = pgEnum('account_status', [
  'invited',
  'active',
  'suspended',
  'deleted'
]);

// Define accounts table
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  intro: text("intro"),
  email: text("email").notNull().unique(),
  status: accountStatusEnum("status").notNull().default('invited'),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
