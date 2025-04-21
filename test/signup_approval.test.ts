import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { db } from "../lib/db.ts";
import { signupRequests } from "../db/schema/signup.ts";
import { accounts } from "../db/schema/account.ts";
import { eq } from "drizzle-orm";

// Helper function to get pending signup requests
export async function getPendingSignupRequests() {
  return await db.select().from(signupRequests)
    .where(eq(signupRequests.state, "pending"))
    .orderBy(signupRequests.createdAt);
}

// Helper function to approve a signup request
export async function approveSignupRequest(requestId: string) {
  // Get the request
  const req = await db.select().from(signupRequests)
    .where(eq(signupRequests.id, requestId))
    .limit(1)
    .then(rows => rows[0] || null);

  if (!req) {
    throw new Error("Signup request not found");
  }
  if (req.state !== "pending") {
    throw new Error(`Cannot approve request in state ${req.state}`);
  }

  // Create account in invited state
  const [account] = await db.insert(accounts).values({
    username: req.username,
    intro: req.intro,
    email: req.email,
    status: "invited",
  }).returning();

  // Mark request approved and link to account
  await db.update(signupRequests)
    .set({ 
      state: "approved", 
      invitationAccountId: account.id 
    })
    .where(eq(signupRequests.id, requestId));

  return { account, request: req };
}

// Test that getPendingSignupRequests only returns pending requests
Deno.test("getPendingSignupRequests only returns pending requests", async () => {
  // Create test requests with different states
  const testData = [
    { username: "pending1", email: "pending1@example.com", state: "pending" },
    { username: "approved1", email: "approved1@example.com", state: "approved" },
    { username: "rejected1", email: "rejected1@example.com", state: "rejected" },
    { username: "pending2", email: "pending2@example.com", state: "pending" },
  ];

  const insertedIds = [];
  
  try {
    // Insert test data
    for (const data of testData) {
      const [inserted] = await db.insert(signupRequests).values({
        username: data.username,
        email: data.email,
        state: data.state as any,
      }).returning();
      insertedIds.push(inserted.id);
    }

    // Get pending requests
    const pendingRequests = await getPendingSignupRequests();
    
    // Verify only pending requests are returned
    assertEquals(
      pendingRequests.filter(r => 
        r.username === "pending1" || r.username === "pending2"
      ).length, 
      2
    );
    
    assertEquals(
      pendingRequests.filter(r => 
        r.username === "approved1" || r.username === "rejected1"
      ).length, 
      0
    );
  } finally {
    // Clean up test data
    for (const id of insertedIds) {
      await db.delete(signupRequests).where(eq(signupRequests.id, id));
    }
  }
});

// Test approveSignupRequest function
Deno.test("approveSignupRequest creates account and updates request", async () => {
  // Create a test signup request
  const [request] = await db.insert(signupRequests).values({
    username: "testapproval",
    email: "testapproval@example.com",
    intro: "Test approval process",
  }).returning();
  
  try {
    // Approve the request
    const result = await approveSignupRequest(request.id);
    
    // Verify account was created
    assertEquals(result.account.username, "testapproval");
    assertEquals(result.account.email, "testapproval@example.com");
    assertEquals(result.account.status, "invited");
    
    // Verify request was updated
    const updatedRequest = await db.select().from(signupRequests)
      .where(eq(signupRequests.id, request.id))
      .limit(1)
      .then(rows => rows[0] || null);
    
    assertEquals(updatedRequest?.state, "approved");
    assertEquals(updatedRequest?.invitationAccountId, result.account.id);
  } finally {
    // Clean up
    await db.delete(signupRequests).where(eq(signupRequests.id, request.id));
    await db.delete(accounts).where(eq(accounts.email, "testapproval@example.com"));
  }
});
