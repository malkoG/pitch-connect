import { Handlers } from "$fresh/server.ts";
import { db } from "../../lib/db.ts";
import { actors } from "../../models/schema.ts";
import { eq } from "drizzle-orm";
import federation from "../../federation/mod.ts";

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
  const [actor] = await db.select().from(actors).where(eq(actors.preferredUsername, username));
  
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
    const [existingActor] = await db.select().from(actors).where(eq(actors.id, actor.id));
    
    if (!existingActor) {
      // Extract hostname from actor id
      const actorUrl = new URL(actor.id);
      const hostname = actorUrl.hostname;
      
      // Extract preferredUsername
      const preferredUsername = actor.preferredUsername || 
                               actor.id.split('/').pop();
      
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
      const [newActor] = await db.select().from(actors).where(eq(actors.id, actor.id));
      return { handle, actor: newActor };
    }
    
    // If actor exists, return it
    const handle = `${existingActor.preferredUsername}@${new URL(existingActor.id || "").hostname}`;
    return { handle, actor: existingActor };
  } catch (error) {
    console.error("Error saving remote actor:", error);
    return null;
  }
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const { username } = ctx.params;
    
    // Check if the client is requesting ActivityPub format
    const acceptHeader = req.headers.get("Accept") || "";
    const wantsActivityJson = acceptHeader.includes("application/activity+json") || 
                             acceptHeader.includes("application/ld+json");
    
    // Get the host from the request URL
    const url = new URL(req.url);
    const host = url.hostname;
    
    // Construct the handle from the username and request host
    const handle = `${username}@${host}`;
    
    // Try to get the account by handle
    let accountInfo = await getAccountByHandle(handle);
    
    // If not found and federation is available, try to fetch from remote
    if (!accountInfo && federation) {
      const actorUrl = `https://${host}/@${username}`;
      try {
        // Call context.getActor(actorUrl)
        const remoteActor = await federation.getActor(actorUrl);
        
        // If an actor is returned, save it
        if (remoteActor) {
          await saveRemoteActor(remoteActor);
          // Retry getting the account
          accountInfo = await getAccountByHandle(handle);
        }
      } catch (error) {
        console.error("Error fetching remote actor:", error);
      }
    }
    
    // If we found the actor, use it
    if (accountInfo && accountInfo.actor) {
      const actor = accountInfo.actor;
    
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
    
    // If we couldn't find the actor, return 404
    return new Response("Actor not found", { status: 404 });
  }
};
