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

    // Extract username from acct:username@domain
    const parts = resource.replace("acct:", "").split("@");
    const username = parts[0];
    
    // Verify this is for our domain (optional but recommended)
    // const domain = parts[1];
    // if (domain !== "yourdomain") {
    //   return new Response("Bad Request: Not our domain", { status: 400 });
    // }

    // Look up the actor in our database
    const [actor] = await db.select().from(actors).where(eq(actors.preferredUsername, username));
    if (!actor) {
      return new Response("Not Found: No such user", { status: 404 });
    }

    // Return WebFinger response with links to the actor
    return Response.json({
      subject: `acct:${actor.preferredUsername}@yourdomain`,
      links: [
        {
          rel: "self",
          type: "application/activity+json",
          href: `https://yourdomain/@${actor.preferredUsername}`
        },
        {
          rel: "http://webfinger.net/rel/profile-page",
          type: "text/html",
          href: `https://yourdomain/@${actor.preferredUsername}`
        }
      ]
    }, {
      headers: {
        "Content-Type": "application/jrd+json",
        "Cache-Control": "max-age=3600"
      }
    });
  }
};
