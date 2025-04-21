import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { db } from "../lib/db.ts";
import { signupRequests } from "../db/schema/signup.ts";
import { handler } from "../routes/sign/up/index.ts";
import { eq } from "drizzle-orm";

// Mock request creator
function createMockRequest(body: any): Request {
  return new Request("http://localhost:8000/sign/up", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// Test successful signup request
Deno.test("POST /sign/up - successful request", async () => {
  // Create a test request
  const mockRequest = createMockRequest({
    username: "testuser",
    intro: "Test signup",
    email: "test-signup@example.com",
  });
  
  try {
    // Call the handler directly
    const response = await handler.POST(mockRequest);
    
    // Check status and response
    assertEquals(response.status, 202);
    const responseData = await response.json();
    assertEquals(responseData.ok, true);
    
    // Verify the record was created in the database
    const requests = await db.select().from(signupRequests)
      .where(eq(signupRequests.email, "test-signup@example.com"));
    
    assertEquals(requests.length, 1);
    assertEquals(requests[0].username, "testuser");
    assertEquals(requests[0].state, "pending");
  } finally {
    // Clean up - delete the test signup request
    await db.delete(signupRequests)
      .where(eq(signupRequests.email, "test-signup@example.com"));
  }
});

// Test duplicate email
Deno.test("POST /sign/up - duplicate email", async () => {
  // First, create a signup request
  await db.insert(signupRequests).values({
    username: "existinguser",
    email: "existing@example.com",
  });
  
  try {
    // Try to create another signup with the same email
    const mockRequest = createMockRequest({
      username: "newuser",
      email: "existing@example.com",
    });
    
    const response = await handler.POST(mockRequest);
    
    // Should return 409 Conflict
    assertEquals(response.status, 409);
    const responseData = await response.json();
    assertEquals(responseData.error, "Email already registered");
  } finally {
    // Clean up
    await db.delete(signupRequests)
      .where(eq(signupRequests.email, "existing@example.com"));
  }
});
