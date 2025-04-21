import { assertEquals, assertStrictEquals } from "https://deno.land/std/testing/asserts.ts";
import { magicLinks, magicTokenTypeEnum } from "../db/schema/magic_link.ts";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";

// This is a simple test to verify the magic links schema
Deno.test("Magic links schema - default consumed_at is NULL", async () => {
  // Create a test connection
  const connectionString = Deno.env.get("DATABASE_URL") || "postgres://postgres:postgres@localhost:5432/test";
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);
  
  try {
    // Create a test magic link token
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const testMagicLink = {
      tokenHash: "hashed_token_value_here",
      type: "signup" as const,
      expiresAt: expiryDate
    };
    
    const [insertedLink] = await db.insert(magicLinks).values(testMagicLink).returning();
    
    // Assert that consumed_at is NULL by default
    assertStrictEquals(insertedLink.consumedAt, null);
    
    // Clean up - delete the test magic link
    await db.delete(magicLinks).where(eq(magicLinks.id, insertedLink.id));
  } finally {
    await sql.end();
  }
});
