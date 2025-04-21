import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { accounts } from "../db/schema/account.ts";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// This is a simple test to verify the account schema
Deno.test("Account schema - default status is invited", async () => {
  // Create a test connection
  const connectionString = Deno.env.get("DATABASE_URL") || "postgres://postgres:postgres@localhost:5432/test";
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);
  
  try {
    // Insert a test account
    const testAccount = {
      username: "testuser",
      email: "test@example.com",
      intro: "Test account"
    };
    
    const [insertedAccount] = await db.insert(accounts).values(testAccount).returning();
    
    // Assert that the default status is 'invited'
    assertEquals(insertedAccount.status, "invited");
    
    // Clean up - delete the test account
    await db.delete(accounts).where(eq(accounts.id, insertedAccount.id));
  } finally {
    await sql.end();
  }
});
