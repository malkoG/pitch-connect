import { Handlers } from "$fresh/server.ts";
import { db } from "../../../lib/db.ts";
import { magicLinks } from "../../../db/schema/magic_link.ts";
import { signupRequests } from "../../../db/schema/signup.ts";
import { accounts } from "../../../db/schema/account.ts";
import { verifyMagicLink } from "../../../utils/magic_link.ts";
import { eq } from "drizzle-orm";

export const handler: Handlers = {
  async GET(req, ctx) {
    const token = ctx.params.token;
    
    if (!token) {
      return new Response("Invalid token", { status: 400 });
    }
    
    // Verify the token
    const magicLink = await verifyMagicLink(token);
    
    if (!magicLink) {
      return new Response("Invalid or expired token", { status: 400 });
    }
    
    // Check if it's a signup token
    if (magicLink.type !== "signup") {
      return new Response("Invalid token type", { status: 400 });
    }
    
    // Get the signup request
    const signupRequest = await db.select().from(signupRequests)
      .where(eq(signupRequests.id, magicLink.requestId!))
      .limit(1)
      .then(rows => rows[0] || null);
    
    if (!signupRequest) {
      return new Response("Signup request not found", { status: 400 });
    }
    
    // Start a transaction to complete the signup process
    try {
      // In a real application, this would be a transaction
      // For simplicity, we're doing sequential operations
      
      // 1. Update signup request state to completed
      await db.update(signupRequests)
        .set({ state: "completed" })
        .where(eq(signupRequests.id, signupRequest.id));
      
      // 2. Update the account status to active
      await db.update(accounts)
        .set({ status: "active" })
        .where(eq(accounts.id, signupRequest.invitationAccountId!));
      
      // 3. Get the updated account
      const account = await db.select().from(accounts)
        .where(eq(accounts.id, signupRequest.invitationAccountId!))
        .limit(1)
        .then(rows => rows[0] || null);
      
      if (!account) {
        throw new Error("Account not found after activation");
      }
      
      // Log the successful signup
      console.log(`✅ Signup completed for ${account.username} <${account.email}>`);
      
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
    } catch (error) {
      console.error("Error completing signup:", error);
      return new Response("Error completing signup", { status: 500 });
    }
  }
};
