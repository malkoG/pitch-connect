import { Handlers } from "$fresh/server.ts";
import { db } from "../../lib/db.ts";
import { actors } from "../../models/schema.ts";
import { eq } from "drizzle-orm";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource");

    if (!resource?.startsWith("acct:")) {
      return new Response("Bad Request: Resource must start with 'acct:'", { status: 400 });
    }

    // Extract username and domain from acct:username@domain
    const parts = resource.replace("acct:", "").split("@");
    if (parts.length !== 2) {
      return new Response("Bad Request: Invalid resource format", { status: 400 });
    }
    
    const username = parts[0];
    const domain = parts[1];
    
    // Get current host
    const currentHost = url.hostname;
    
    // Verify this is for our domain
    if (domain !== currentHost) {
      return new Response("Not Found: Domain mismatch", { status: 404 });
    }

    // Look up the actor in our database
    const [actor] = await db.select().from(actors).where(eq(actors.preferredUsername, username));
    if (!actor) {
      return new Response("Not Found: No such user", { status: 404 });
    }

    // Return WebFinger response with links to the actor
    return Response.json({
      subject: `acct:${username}@${domain}`,
      links: [
        {
          rel: "self",
          type: "application/activity+json",
          href: `https://${domain}/u/${username}`
        }
      ]
    }, {
      headers: {
        "Content-Type": "application/jrd+json"
      }
    });
  }
};
