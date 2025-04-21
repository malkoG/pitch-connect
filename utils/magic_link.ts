import { magicLinks } from "../db/schema/magic_link.ts";
import { db } from "../lib/db.ts";
import { eq, sql, isNull } from "drizzle-orm";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

/**
 * Options for creating a magic link
 */
interface CreateMagicLinkOptions {
  type: "signup" | "signin";
  accountId?: string;
  requestId?: string;
  expiresInMinutes?: number;
}

/**
 * Creates a magic link token, hashes it, and stores it in the database
 * @param opts Options for creating the magic link
 * @returns The plain text token that should be sent to the user
 */
export async function createMagicLink(opts: CreateMagicLinkOptions): Promise<string> {
  // Generate a random token
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = Array.from(tokenBytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  // Hash the token for storage
  const tokenHash = await bcrypt.hash(token);
  
  // Calculate expiration time (default: 30 minutes)
  const expiresInMinutes = opts.expiresInMinutes || 30;
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
  
  // Insert the magic link record
  await db.insert(magicLinks).values({
    accountId: opts.accountId,
    requestId: opts.requestId,
    tokenHash,
    type: opts.type,
    expiresAt,
  });
  
  return token;
}

/**
 * Verifies a magic link token and marks it as consumed if valid
 * @param token The plain text token to verify
 * @returns The magic link record if valid, null otherwise
 */
export async function verifyMagicLink(token: string) {
  // Find all unexpired and unconsumed tokens
  const now = new Date();
  const activeTokens = await db.select().from(magicLinks).where(
    isNull(magicLinks.consumedAt)
  );
  
  // Check each token by comparing the hash
  for (const magicLink of activeTokens) {
    try {
      const isMatch = await bcrypt.compare(token, magicLink.tokenHash);
      
      if (isMatch) {
        // Check if the token is expired
        if (magicLink.expiresAt < now) {
          return null; // Token is expired
        }
        
        // Mark the token as consumed
        await db.update(magicLinks)
          .set({ consumedAt: now })
          .where(eq(magicLinks.id, magicLink.id));
        
        return magicLink;
      }
    } catch (error) {
      console.error("Error verifying token:", error);
    }
  }
  
  return null; // No matching token found
}

/**
 * Verifies a signup token and returns the associated signup request
 * @param token The plain text token to verify
 * @returns The signup request if valid, null otherwise
 */
export async function verifySignupToken(token: string) {
  const magicLink = await verifyMagicLink(token);
  
  if (!magicLink || magicLink.type !== "signup" || !magicLink.requestId) {
    return null;
  }
  
  // Get the signup request
  const signupRequest = await db.select().from(signupRequests)
    .where(eq(signupRequests.id, magicLink.requestId))
    .limit(1)
    .then(rows => rows[0] || null);
  
  if (!signupRequest || !signupRequest.invitationAccountId) {
    return null;
  }
  
  return signupRequest;
}
