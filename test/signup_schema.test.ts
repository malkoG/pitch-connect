import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { signupRequests } from "../db/schema/signup.ts";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";

// This is a simple test to verify the signup request schema
Deno.test("Signup request schema - default state is pending", async () => {
  // Create a test connection
  const connectionString = Deno.env.get("DATABASE_URL") || "postgres://postgres:postgres@localhost:5432/test";
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);
  
  try {
    // Insert a test signup request
    const testSignupRequest = {
      username: "newuser",
      email: "newuser@example.com",
      intro: "New user signup request"
    };
    
    const [insertedRequest] = await db.insert(signupRequests).values(testSignupRequest).returning();
    
    // Assert that the default state is 'pending'
    assertEquals(insertedRequest.state, "pending");
    
    // Clean up - delete the test signup request
    await db.delete(signupRequests).where(eq(signupRequests.id, insertedRequest.id));
  } finally {
    await sql.end();
  }
});
