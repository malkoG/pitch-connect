import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { accounts } from "./account.ts";

// Define signup request state enum
export const signupRequestStateEnum = pgEnum('signup_request_state', [
  'pending',
  'approved',
  'rejected',
  'completed'
]);

// Define signup_requests table
export const signupRequests = pgTable("signup_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull(),
  intro: text("intro"),
  email: text("email").notNull(),
  state: signupRequestStateEnum("state").notNull().default('pending'),
  invitationAccountId: uuid("invitation_account_id").references(() => accounts.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
