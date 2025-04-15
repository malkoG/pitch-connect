import { Handlers } from "$fresh/server.ts";
import { db } from "../../lib/db.ts";
import { posts } from "../../models/schema.ts";
import { eq } from "drizzle-orm";

// Temporary function to resolve username to actor ID
// This will be replaced with proper user management later
async function resolveActorId(username: string): Promise<string> {
  // For now, return a fixed UUID for demo purposes
  return "00000000-0000-0000-0000-000000000000";
}

export const handler: Handlers = {
  async GET(_req, ctx) {
    const { username } = ctx.params;
    const actorId = await resolveActorId(username);

    const actorPosts = await db.select().from(posts)
      .where(eq(posts.actorId, actorId))
      .orderBy(posts.publishedAt);

    const activities = actorPosts.map((post) => ({
      type: "Create",
      actor: `https://yourdomain/@${username}`,
      id: post.iri,
      object: {
        type: "Note",
        content: post.content,
        published: post.publishedAt.toISOString(),
      },
    }));

    return new Response(JSON.stringify({
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      totalItems: activities.length,
      orderedItems: activities,
    }), {
      headers: { 
        "Content-Type": "application/activity+json",
        "Cache-Control": "max-age=60"
      },
    });
  }
};
