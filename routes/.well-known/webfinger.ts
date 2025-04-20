import { Handlers } from "$fresh/server.ts";
import { lookupObject } from "@fedify/fedify";
import { db } from "../../lib/db.ts";
import { actors } from "../../models/schema.ts";
import { eq } from "drizzle-orm";
import { getLogger } from "@logtape/logtape";

const logger = getLogger("pitch-connect");

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource");

    if (!resource?.startsWith("acct:")) {
      return new Response("Bad Request: Resource must start with 'acct:'", {
        status: 400,
      });
    }

    // Extract username and domain from acct:username@domain
    const handle = resource.replace("acct:", "");
    const parts = handle.split("@");
    if (parts.length !== 2) {
      return new Response("Bad Request: Invalid resource format", {
        status: 400,
      });
    }

    const username = parts[0];
    const domain = parts[1];

    // Look up the actor in our database
    const [actor] = await db.select().from(actors).where(
      eq(actors.preferredUsername, username),
    );
    if (!actor) {
      if (!domain) {
        return new Response("Not Found: No such user", { status: 404 });
      }

      const result = await lookupObject(handle);
      if (result) {
        // print
        Object.keys(result).forEach((key) => {
          logger.debug(`${key}: ${result[key]}`);
        });
        logger.debug(`${JSON.stringify(Object.keys(result))}`);
      }
      logger.debug(`Result: ${JSON.stringify(result)}`);
      if (!result) {
        return new Response("Not Found: No such user", { status: 404 });
      }
    }

    // Return WebFinger response with links to the actor
    return Response.json({
      subject: `acct:${username}@${domain}`,
      links: [
        {
          rel: "self",
          type: "application/activity+json",
        },
      ],
    }, {
      headers: {
        "Content-Type": "application/jrd+json",
      },
    });
  },
};
