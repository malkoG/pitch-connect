import { Handlers } from "$fresh/server.ts";
import { db } from "../../lib/db.ts";
import { actors } from "../../models/schema.ts";
import { eq } from "drizzle-orm";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { username } = ctx.params;
    
    // Check if the client is requesting ActivityPub format
    const acceptHeader = req.headers.get("Accept") || "";
    const wantsActivityJson = acceptHeader.includes("application/activity+json") || 
                             acceptHeader.includes("application/ld+json");
    
    // Find the actor in the database
    const [actor] = await db.select().from(actors).where(eq(actors.preferredUsername, username));
    
    if (!actor) {
      return new Response("Actor not found", { status: 404 });
    }
    
    // If client wants ActivityPub format or explicitly requests it
    if (wantsActivityJson) {
      return new Response(JSON.stringify({
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": `https://yourdomain/@${actor.preferredUsername}`,
        "type": "Person",
        "preferredUsername": actor.preferredUsername,
        "name": actor.name ?? actor.preferredUsername,
        "summary": actor.summary,
        "inbox": actor.inbox,
        "outbox": actor.outbox,
        "url": `https://yourdomain/@${actor.preferredUsername}`,
        "published": actor.createdAt.toISOString(),
      }), {
        headers: { 
          "Content-Type": "application/activity+json",
          "Cache-Control": "max-age=3600"
        }
      });
    }
    
    // For regular web browsers, render a profile page (to be implemented)
    // This is a placeholder for now
    return new Response(`<html><body><h1>Profile of @${actor.preferredUsername}</h1></body></html>`, {
      headers: { "Content-Type": "text/html" }
    });
  }
};
