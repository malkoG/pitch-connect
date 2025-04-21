import { Handlers } from "$fresh/server.ts";
import { db } from "../../../lib/db.ts";
import { signupRequests } from "../../../db/schema/signup.ts";
import { eq } from "drizzle-orm";

interface SignupRequestBody {
  username: string;
  intro?: string;
  email: string;
}

export const handler: Handlers = {
  async POST(req) {
    try {
      // Parse and validate the request body
      const body: SignupRequestBody = await req.json();
      
      // Basic validation
      if (!body.username || !body.email) {
        return new Response(
          JSON.stringify({ error: "Username and email are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Check if email already exists in signup_requests
      const existingRequests = await db.select({ id: signupRequests.id })
        .from(signupRequests)
        .where(eq(signupRequests.email, body.email));
      
      if (existingRequests.length > 0) {
        return new Response(
          JSON.stringify({ error: "Email already registered" }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Insert the signup request
      await db.insert(signupRequests).values({
        username: body.username,
        intro: body.intro || null,
        email: body.email,
        // state defaults to 'pending'
      });
      
      // Return success response
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error processing signup request:", error);
      
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
