import { assertEquals, assertNotEquals } from "https://deno.land/std/testing/asserts.ts";
import { createMagicLink, verifyMagicLink } from "../utils/magic_link.ts";
import { db } from "../lib/db.ts";
import { magicLinks } from "../db/schema/magic_link.ts";

Deno.test("Magic link utils - create and verify flow", async () => {
  // Create a magic link token
  const token = await createMagicLink({
    type: "signup",
    expiresInMinutes: 5,
  });
  
  // Token should be a non-empty string
  assertNotEquals(token, "");
  
  // Verify the token - should succeed the first time
  const verifiedLink = await verifyMagicLink(token);
  assertEquals(!!verifiedLink, true, "First verification should succeed");
  assertEquals(verifiedLink?.type, "signup");
  
  // Verify again - should fail because token was consumed
  const secondVerify = await verifyMagicLink(token);
  assertEquals(secondVerify, null, "Second verification should fail");
});

// Clean up test data after all tests
Deno.test({
  name: "Clean up magic link test data",
  fn: async () => {
    // This is a simple cleanup that removes all test tokens
    // In a real application, you might want to be more selective
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    await db.delete(magicLinks).where(
      (links) => {
        return links.createdAt > oneHourAgo;
      }
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
