import { FreshContext, Handlers } from "$fresh/server.ts";
import { getLogger } from "@logtape/logtape";
import { db } from "../../lib/db.ts";
import { accounts } from "../../db/schema/account.ts";
import { actors } from "../../models/schema.ts";
import { posts } from "../../models/schema.ts";
import { eq, desc } from "drizzle-orm";
import federation from "../../federation/mod.ts";

const logger = getLogger("pitch-connect");

interface ProfileData {
  account: {
    id: string;
    username: string;
    intro: string | null;
    createdAt: Date;
  };
  posts: Array<{
    id: string;
    content: string;
    publishedAt: Date;
  }>;
}
/**
 * Get an account by handle (username@domain)
 * @param handle The handle in the format username@domain
 * @returns Object containing the handle and actor if found, null otherwise
 */
async function getAccountByHandle(handle: string) {
  // Parse the handle into username and domain
  const parts = handle.split("@");

  // Handle must have at least a username and domain
  if (parts.length < 2) {
    return null;
  }

  const username = parts[0];
  // We don't use domain for now, but it's extracted for future use
  // const domain = parts[1];

  // Query the actors table by preferredUsername
  const [actor] = await db.select().from(actors).where(
    eq(actors.preferredUsername, username),
  );

  // If an actor is found, return the handle and actor
  if (actor) {
    return { handle, actor };
  }

  // Otherwise, return null
  return null;
}

/**
 * Save a remote actor to the database
 * @param actor The actor object from ActivityPub
 * @returns The saved actor or null if failed
 */
async function saveRemoteActor(actor: any) {
  try {
    // Check if the actor exists in actorTable by id
    const [existingActor] = await db.select().from(actors).where(
      eq(actors.id, actor.id),
    );

    if (!existingActor) {
      // Extract hostname from actor id
      const actorUrl = new URL(actor.id);
      const hostname = actorUrl.hostname;

      // Extract preferredUsername
      const preferredUsername = actor.preferredUsername ||
        actor.id.split("/").pop();

      // Insert a new actor row
      await db.insert(actors).values({
        id: actor.id,
        preferredUsername: preferredUsername,
        name: actor.name || preferredUsername,
        summary: actor.summary || "",
        inbox: actor.inbox,
        outbox: actor.outbox || "",
      });

      // Generate handle as preferredUsername@hostname
      const handle = `${preferredUsername}@${hostname}`;

      // Note: We're not handling accountTable insertion here as it's not
      // defined in the schema provided. This would be implemented when
      // the accountTable is added to the schema.

      // Return the newly created actor
      const [newActor] = await db.select().from(actors).where(
        eq(actors.id, actor.id),
      );
      return { handle, actor: newActor };
    }

    // If actor exists, return it
    const handle = `${existingActor.preferredUsername}@${
      new URL(existingActor.id || "").hostname
    }`;
    return { handle, actor: existingActor };
  } catch (error) {
    console.error("Error saving remote actor:", error);
    return null;
  }
}

export const handler: Handlers = {
  async GET(req: Request, ctx: FreshContext) {
    const { username } = ctx.params;
    logger.debug("Request for user:", username);
    console.log("Request for user:", username);

    logger.debug("Request for user profile:", username);

    // --- Handle ActivityPub Request ---
    const acceptHeader = req.headers.get("Accept") || "";
    const wantsActivityJson =
      acceptHeader.includes("application/activity+json") ||
      acceptHeader.includes("application/ld+json");

    if (wantsActivityJson) {
      const [actor] = await db.select().from(actors).where(
        eq(actors.preferredUsername, username),
      );

      if (!actor) {
        return new Response("Actor not found", { status: 404 });
      }

      const url = new URL(req.url);
      const host = url.hostname;
      const actorUrl = `https://${host}/@${username}`;

      return Response.json({
        "@context": [
          "https://www.w3.org/ns/activitystreams",
          "https://w3id.org/security/v1",
        ],
        "id": actorUrl,
        "type": "Person",
        "preferredUsername": username,
        "name": actor.name ?? actor.preferredUsername,
        "summary": actor.summary || "",
        "inbox": actor.inbox || `${actorUrl}/inbox`,
        "outbox": actor.outbox || `${actorUrl}/outbox`,
      }, {
        headers: {
          "Content-Type": "application/activity+json",
          "Cache-Control": "max-age=3600",
        },
      });
    }

    // --- Handle HTML Page Request ---
    const [accountData] = await db.select({
        id: accounts.id,
        username: accounts.username,
        intro: accounts.intro,
        createdAt: accounts.createdAt
      })
      .from(accounts)
      .where(eq(accounts.username, username))
      .limit(1);

    if (!accountData) {
      logger.warn("Account not found for username:", username);
      return ctx.renderNotFound();
    }

    const userPosts = await db.select({
        id: posts.id,
        content: posts.content,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.actorId, accountData.id))
      .orderBy(desc(posts.publishedAt));

    return ctx.render({ account: accountData, posts: userPosts });
  },
};
