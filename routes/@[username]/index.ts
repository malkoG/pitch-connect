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
      // Get the host from the request URL
      const url = new URL(req.url);
      const host = url.hostname;
      
      // Construct the ActivityPub actor representation
      const actorUrl = `https://${host}/@${username}`;
      
      return Response.json({
        "@context": [
          "https://www.w3.org/ns/activitystreams",
          "https://w3id.org/security/v1"
        ],
        "id": actorUrl,
        "type": "Person",
        "preferredUsername": username,
        "name": actor.name ?? actor.preferredUsername,
        "summary": actor.summary || "",
        "inbox": `${actorUrl}/inbox`,
        "outbox": `${actorUrl}/outbox`,
        "followers": `${actorUrl}/followers`,
        "following": `${actorUrl}/following`,
        "publicKey": {
          "id": `${actorUrl}#main-key`,
          "owner": actorUrl
        }
      }, {
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
