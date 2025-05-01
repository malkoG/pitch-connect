import { magicLinks } from "../db/schema/magic_link.ts";
import { signupRequests } from "../db/schema/signup.ts";
import { db } from "../lib/db.ts";
import { accounts } from "../db/schema/account.ts";
import { eq, isNull, sql } from "drizzle-orm";
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
export async function createMagicLink(
  opts: CreateMagicLinkOptions,
): Promise<string> {
  // Generate a random token
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = Array.from(tokenBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
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
 * Finds a valid (unconsumed, unexpired) magic link matching the token hash WITHOUT consuming it.
 * @param token The plain text token to check
 * @returns The magic link record if valid and found, null otherwise.
 */
async function findValidMagicLinkByToken(token: string): Promise<any | null> {
  const now = new Date();
  const activeTokens = await db.select().from(magicLinks).where(
    isNull(magicLinks.consumedAt)
  );

  for (const magicLink of activeTokens) {
    try {
      const isMatch = await bcrypt.compare(token, magicLink.tokenHash);
      if (isMatch) {
        if (magicLink.expiresAt < now) {
          console.log(`Token ${token.substring(0, 6)}... found but expired.`);
          return null;
        }
        return magicLink;
      }
    } catch (error) {
      console.error("Error comparing token hash:", error);
    }
  }
  console.log(`No active token found matching ${token.substring(0, 6)}...`);
  return null;
}

/**
 * Verifies a magic link token's validity WITHOUT consuming it.
 * @param token The plain text token to check
 * @returns The magic link record if valid, null otherwise
 */
export async function checkMagicLinkValidity(token: string) {
  return await findValidMagicLinkByToken(token);
}

/**
 * Verifies a magic link token AND consumes it if valid.
 * @param token The plain text token to verify and consume
 * @returns The magic link record if valid and consumed successfully, null otherwise
 */
export async function verifyAndConsumeMagicLink(token: string): Promise<any | null> {
  const magicLink = await findValidMagicLinkByToken(token);

  if (magicLink) {
    const updateResult = await db.update(magicLinks)
      .set({ consumedAt: new Date() })
      .where(eq(magicLinks.id, magicLink.id))
      .returning();

    if (updateResult && updateResult.length > 0) {
      return magicLink;
    } else {
      console.error(`Failed to consume token ID: ${magicLink.id}`);
      return null;
    }
  }
  return null;
}

/** @deprecated Prefer verifyAndConsumeMagicLink or checkMagicLinkValidity */
export async function verifyMagicLink(token: string) {
  return await verifyAndConsumeMagicLink(token);
}

/**
 * Checks a signup token's validity WITHOUT consuming it.
 * @param token The plain text token to check
 * @returns The signup request if the token is valid, null otherwise
 */
export async function checkSignupTokenValidity(token: string) {
  const magicLink = await checkMagicLinkValidity(token);

  if (!magicLink || magicLink.type !== "signup" || !magicLink.requestId) {
    return null;
  }

  const signupRequest = await db.select().from(signupRequests)
    .where(eq(signupRequests.id, magicLink.requestId))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!signupRequest || signupRequest.state !== 'approved' || !signupRequest.invitationAccountId) {
    console.log(`Signup request ${magicLink.requestId} not found, not approved, or not linked.`);
    return null;
  }

  return signupRequest;
}

/**
 * Verifies AND consumes a signup token.
 * @param token The plain text token to verify and consume
 * @returns The signup request if valid and consumed successfully, null otherwise
 */
export async function verifySignupToken(token: string) {
  const magicLink = await verifyAndConsumeMagicLink(token);

  if (!magicLink || magicLink.type !== "signup" || !magicLink.requestId) {
    return null;
  }

  const signupRequest = await db.select().from(signupRequests)
    .where(eq(signupRequests.id, magicLink.requestId))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!signupRequest || signupRequest.state !== 'approved' || !signupRequest.invitationAccountId) {
    console.warn(`Consumed signup token ${token.substring(0,6)}... but associated request ${magicLink.requestId} is invalid/missing.`);
    return null;
  }

  return signupRequest;
}

/**
 * Checks a signin token's validity WITHOUT consuming it.
 * @param token The plain text token to check
 * @returns The account if the token is valid, null otherwise
 */
export async function checkSigninTokenValidity(token: string): Promise<any | null> {
    const magicLink = await checkMagicLinkValidity(token);

    if (!magicLink || magicLink.type !== "signin" || !magicLink.accountId) {
        return null;
    }

    const account = await db.select().from(accounts)
        .where(eq(accounts.id, magicLink.accountId))
        .limit(1)
        .then((rows) => rows[0] || null);

    if (!account || account.status !== 'active') {
        console.log(`Signin token valid but account ${magicLink.accountId} not found or not active.`);
        return null;
    }

    return account;
}

/**
 * Verifies AND consumes a signin token.
 * @param token The plain text token to consume
 * @returns The account if valid and consumed successfully, null otherwise
 */
export async function consumeSignInToken(token: string): Promise<any | null> {
  const magicLink = await verifyAndConsumeMagicLink(token);

  if (!magicLink || magicLink.type !== "signin" || !magicLink.accountId) {
    return null;
  }

  const account = await db.select().from(accounts)
    .where(eq(accounts.id, magicLink.accountId))
    .limit(1)
    .then((rows) => rows[0] || null);

   if (!account || account.status !== 'active') {
     console.warn(`Consumed signin token ${token.substring(0,6)}... but associated account ${magicLink.accountId} not found or not active.`);
     return null;
   }

  return account;
}

export async function createSignInLink(accountId: string): Promise<URL> {
  const token = await createMagicLink({
    type: "signin",
    accountId,
    expiresInMinutes: 15,
  });

  const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:8000";
  return new URL(`/sign/in/${token}`, baseUrl);
}
