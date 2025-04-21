import { db } from "./db.ts";
import { accounts } from "../db/schema/account.ts";
import { signupRequests } from "../db/schema/signup.ts";
import { eq } from "drizzle-orm";

/**
 * Completes the signup process by activating the account
 */
export async function completeSignup({ 
  request, 
  password 
}: { 
  request: any; 
  password?: string;
}) {
  // In a real application, you would hash the password and store it
  // For this example, we'll just activate the account
  
  // 1. Update signup request state to completed
  await db.update(signupRequests)
    .set({ state: "completed" })
    .where(eq(signupRequests.id, request.id));
  
  // 2. Update the account status to active
  await db.update(accounts)
    .set({ status: "active" })
    .where(eq(accounts.id, request.invitationAccountId));
  
  // 3. Get the updated account
  const account = await db.select().from(accounts)
    .where(eq(accounts.id, request.invitationAccountId))
    .limit(1)
    .then(rows => rows[0] || null);
  
  if (!account) {
    throw new Error("Account not found after activation");
  }
  
  // Log the successful signup
  console.log(`✅ Signup completed for ${account.username} <${account.email}>`);
  
  return account;
}

/**
 * Creates a session for the given account
 * @param ctx The Fresh context
 * @param account The account to create a session for
 * @returns Headers with the session cookie
 */
export function createSession(ctx: any, account: any): Headers {
  // In a real application, you would use a proper session management system
  // with JWT or another secure token format
  const headers = new Headers();
  
  // Set a secure, HTTP-only cookie
  headers.set(
    "Set-Cookie", 
    `session=${account.id}; Path=/; HttpOnly; SameSite=Lax`
  );
  
  return headers;
}
