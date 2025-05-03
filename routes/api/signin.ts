import { Handlers } from "$fresh/server.ts";
import { db } from "../../lib/db.ts";
import { accounts } from "../../models/schema.ts";
import { createSignInLink } from "../../utils/magic_link.ts";
import { eq } from "drizzle-orm";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const email = body.email?.toString().trim();

      // Basic validation
      if (!email?.match(/^[^@]+@[^@]+$/)) {
        return new Response(null, { status: 204 });
      }

      // Find the account with this email
      const account = await db.select().from(accounts)
        .where(eq(accounts.email, email))
        .limit(1)
        .then((rows) => rows[0] || null);

      if (account) {
        // Generate a signin link
        const signInUrl = await createSignInLink(account.id);

        // In a real app, send an email with the link
        console.log(
          `📧 Signin link for ${account.username} <${account.email}>:`,
        );
        console.log(signInUrl.toString());
      }

      // Always return 204 No Content, regardless of whether the account exists
      // This prevents account enumeration attacks
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("Error processing signin request:", error);
      // Still return 204 to avoid leaking information
      return new Response(null, { status: 204 });
    }
  },
};
