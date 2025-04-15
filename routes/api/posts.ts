import { Handlers } from "$fresh/server.ts";
import { db } from "../../lib/db.ts";
import { posts } from "../../models/schema.ts";
import { desc } from "drizzle-orm";
import federation from "../../federation/mod.ts";
import { crypto } from "$std/crypto/mod.ts";

export const handler: Handlers = {
  async GET(_req) {
    const result = await db.select().from(posts).orderBy(
      desc(posts.publishedAt),
    ).limit(20);
    return Response.json(result);
  },

  async POST(req) {
    const body = await req.json();
    const content = body.content;
    if (typeof content !== "string" || content.trim() === "") {
      return new Response("Invalid content", { status: 400 });
    }

    const iri = `https://yourdomain/@me/status/${crypto.randomUUID()}`;
    const actorId = "00000000-0000-0000-0000-000000000000"; // TODO: 인증 기반으로 대체

    const [post] = await db.insert(posts).values({
      actorId,
      content,
      iri,
    }).returning();

    await federation.outbox.post(actorId, {
      type: "Create",
      object: {
        type: "Note",
        content: post.content,
        published: post.publishedAt.toISOString(),
        id: post.iri,
      },
    });

    return new Response("Created", { status: 201 });
  },
};
