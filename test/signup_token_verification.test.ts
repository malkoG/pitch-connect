import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { db } from "../lib/db.ts";
import { signupRequests } from "../db/schema/signup.ts";
import { accounts } from "../db/schema/account.ts";
import { magicLinks } from "../db/schema/magic_link.ts";
import { createMagicLink } from "../utils/magic_link.ts";
import { handler } from "../routes/sign/up/[token].ts";
import { eq } from "drizzle-orm";

// Helper function to create a test context
function createContext(token: string) {
  return {
    params: { token },
    state: {},
    render: () => new Response("Rendered"),
    next: () => Promise.resolve(new Response("Next")),
  };
}

// Test successful token verification and account activation
Deno.test("GET /sign/up/[token] - successful verification", async () => {
  // 1. Create a signup request
  const [signupRequest] = await db.insert(signupRequests).values({
    username: "tokentest",
    email: "tokentest@example.com",
    intro: "Token test user",
  }).returning();
  
  // 2. Create an account in invited state
  const [account] = await db.insert(accounts).values({
    username: signupRequest.username,
    email: signupRequest.email,
    intro: signupRequest.intro,
    status: "invited",
  }).returning();
  
  // 3. Link the account to the signup request
  await db.update(signupRequests)
    .set({ 
      state: "approved", 
      invitationAccountId: account.id 
    })
    .where(eq(signupRequests.id, signupRequest.id));
  
  // 4. Create a magic link token
  const token = await createMagicLink({
    type: "signup",
    accountId: account.id,
    requestId: signupRequest.id,
    expiresInMinutes: 60,
  });
  
  try {
    // 5. Call the handler with the token
    const request = new Request(`http://localhost:8000/sign/up/${token}`);
    const context = createContext(token);
    const response = await handler.GET(request, context as any);
    
    // 6. Check the response
    assertEquals(response.status, 302);
    assertEquals(response.headers.get("Location"), "/");
    
    // 7. Verify the account was activated
    const updatedAccount = await db.select().from(accounts)
      .where(eq(accounts.id, account.id))
      .limit(1)
      .then(rows => rows[0]);
    
    assertEquals(updatedAccount.status, "active");
    
    // 8. Verify the signup request was completed
    const updatedRequest = await db.select().from(signupRequests)
      .where(eq(signupRequests.id, signupRequest.id))
      .limit(1)
      .then(rows => rows[0]);
    
    assertEquals(updatedRequest.state, "completed");
    
    // 9. Try to use the token again - should fail
    const secondResponse = await handler.GET(request, context as any);
    assertEquals(secondResponse.status, 400);
    
  } finally {
    // Clean up
    await db.delete(magicLinks).where(eq(magicLinks.accountId, account.id));
    await db.delete(signupRequests).where(eq(signupRequests.id, signupRequest.id));
    await db.delete(accounts).where(eq(accounts.id, account.id));
  }
});

// Test expired token
Deno.test("GET /sign/up/[token] - expired token", async () => {
  // 1. Create a signup request
  const [signupRequest] = await db.insert(signupRequests).values({
    username: "expiredtest",
    email: "expired@example.com",
    intro: "Expired token test",
  }).returning();
  
  // 2. Create an account in invited state
  const [account] = await db.insert(accounts).values({
    username: signupRequest.username,
    email: signupRequest.email,
    intro: signupRequest.intro,
    status: "invited",
  }).returning();
  
  // 3. Link the account to the signup request
  await db.update(signupRequests)
    .set({ 
      state: "approved", 
      invitationAccountId: account.id 
    })
    .where(eq(signupRequests.id, signupRequest.id));
  
  // 4. Create a magic link token that's already expired
  const token = await createMagicLink({
    type: "signup",
    accountId: account.id,
    requestId: signupRequest.id,
    expiresInMinutes: -60, // Expired 1 hour ago
  });
  
  try {
    // 5. Call the handler with the expired token
    const request = new Request(`http://localhost:8000/sign/up/${token}`);
    const context = createContext(token);
    const response = await handler.GET(request, context as any);
    
    // 6. Check the response - should be 400 Bad Request
    assertEquals(response.status, 400);
    
  } finally {
    // Clean up
    await db.delete(magicLinks).where(eq(magicLinks.accountId, account.id));
    await db.delete(signupRequests).where(eq(signupRequests.id, signupRequest.id));
    await db.delete(accounts).where(eq(accounts.id, account.id));
  }
});
