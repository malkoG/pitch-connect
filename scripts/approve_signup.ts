// bin: deno run -A scripts/approve_signup.ts <request-id>
import { db } from "../lib/db.ts";
import { signupRequests } from "../db/schema/signup.ts";
import { accounts } from "../db/schema/account.ts";
import { createMagicLink } from "../utils/magic_link.ts";
import { eq } from "drizzle-orm";

// Check for admin secret if configured
const adminSecret = Deno.env.get("ADMIN_SECRET");
if (adminSecret) {
  const providedSecret = Deno.env.get("ADMIN_SECRET_INPUT");
  if (providedSecret !== adminSecret) {
    console.error("Error: Admin secret required. Set ADMIN_SECRET_INPUT environment variable.");
    Deno.exit(1);
  }
}

const id = Deno.args[0];
if (!id) {
  console.error("Usage: deno run -A scripts/approve_signup.ts <request-id>");
  Deno.exit(1);
}

const req = await db.select().from(signupRequests)
  .where(eq(signupRequests.id, id))
  .limit(1)
  .then(rows => rows[0] || null);

if (!req) {
  console.error("Signup request not found");
  Deno.exit(1);
}
if (req.state !== "pending") {
  console.error(`Cannot approve request in state ${req.state}`);
  Deno.exit(1);
}

// create account in invited state
const [account] = await db.insert(accounts).values({
  username: req.username,
  intro: req.intro,
  email: req.email,
  status: "invited",
}).returning();

// mark request approved and link to account
await db.update(signupRequests)
  .set({ 
    state: "approved", 
    invitationAccountId: account.id 
  })
  .where(eq(signupRequests.id, id));

// generate signup magic-link
const token = await createMagicLink({
  accountId: account.id,
  requestId: req.id,
  type: "signup",
  expiresInMinutes: 60 * 24, // 24 hours
});

// Construct the full magic link URL
const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:8000";
const magicLink = `${baseUrl}/sign/up/confirm?token=${token}`;

console.log("✅ Approved. Invitation link:");
console.log(magicLink);
