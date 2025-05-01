import { Handlers } from "$fresh/server.ts";
import { db } from "../../lib/db.ts";
import { posts } from "../../models/schema.ts";
import { desc, eq } from "drizzle-orm";
import { accounts } from "../../db/schema/account.ts";
import { getCookies } from "$std/http/cookie.ts";
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
    // --- Authentication Check ---
    const cookies = getCookies(req.headers);
    const sessionId = cookies.session;
    let actorId: string | null = null;

    if (!sessionId) {
      return new Response("Unauthorized: Missing session", { status: 401 });
    }

    try {
      const [account] = await db.select({ id: accounts.id, status: accounts.status })
        .from(accounts)
        .where(eq(accounts.id, sessionId))
        .limit(1);

      if (account && account.status === 'active') {
        actorId = account.id;
      } else {
        return new Response("Unauthorized: Invalid session or inactive account", { status: 401 });
      }
    } catch (error) {
      console.error("Session verification error in POST /api/posts:", error);
      return new Response("Internal Server Error", { status: 500 });
    }

    if (!actorId) {
      return new Response("Unauthorized", { status: 401 });
    }
    // --- End Authentication Check ---
    const body = await req.json();
    const content = body.content;
    if (typeof content !== "string" || content.trim() === "") {
      return new Response("Invalid content", { status: 400 });
    }

    const iri = `https://yourdomain/users/${actorId}/statuses/${crypto.randomUUID()}`;

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
