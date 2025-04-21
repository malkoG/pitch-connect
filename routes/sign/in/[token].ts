import { Handlers } from "$fresh/server.ts";
import { verifyMagicLink } from "../../../utils/magic_link.ts";
import { db } from "../../../lib/db.ts";
import { accounts } from "../../../db/schema/account.ts";
import { eq } from "drizzle-orm";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { token } = ctx.params;
    
    if (!token) {
      return new Response("Invalid token", { status: 400 });
    }
    
    // Verify the token
    const magicLink = await verifyMagicLink(token);
    
    if (!magicLink) {
      return new Response("Invalid or expired token", { status: 400 });
    }
    
    // Check if it's a signin token
    if (magicLink.type !== "signin") {
      return new Response("Invalid token type", { status: 400 });
    }
    
    // Get the account
    const account = await db.select().from(accounts)
      .where(eq(accounts.id, magicLink.accountId!))
      .limit(1)
      .then(rows => rows[0] || null);
    
    if (!account) {
      return new Response("Account not found", { status: 400 });
    }
    
    // Log the successful signin
    console.log(`✅ Signin completed for ${account.username} <${account.email}>`);
    
    // Create a session (simplified for now)
    // In a real app, you would use a proper session management system
    const headers = new Headers();
    headers.set("Set-Cookie", `session=${account.id}; Path=/; HttpOnly; SameSite=Strict`);
    
    // Redirect to home page
    headers.set("Location", "/");
    
    return new Response(null, {
      status: 302,
      headers,
    });
  }
};
