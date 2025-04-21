import { pgTable, uuid, text, timestamp, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { accounts } from "./account.ts";
import { signupRequests } from "./signup.ts";

// Define magic token type enum
export const magicTokenTypeEnum = pgEnum('magic_token_type', [
  'signup',
  'signin'
]);

// Define magic_links table
export const magicLinks = pgTable("magic_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id),
  requestId: uuid("request_id").references(() => signupRequests.id),
  tokenHash: text("token_hash").notNull(),
  type: magicTokenTypeEnum("type").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    // Partial unique index to ensure only one active signup token per request
    requestTokenIdx: uniqueIndex("request_token_idx").on(table.requestId, table.type)
      .where(`consumed_at IS NULL AND type = 'signup'`),
  };
});
