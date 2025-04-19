import { createFederation, Person } from "@fedify/fedify";
import { getLogger } from "@logtape/logtape";
import { PostgresKvStore, PostgresMessageQueue } from "@fedify/postgres";
import postgres from "postgres";
import { db } from "../lib/db.ts";
import { actors } from "../models/schema.ts";
import { eq } from "drizzle-orm";

const logger = getLogger("pitch-connect");

const federation = createFederation({
  kv: new PostgresKvStore(postgres(Deno.env.get("DATABASE_URL"))),
  queue: new PostgresMessageQueue(postgres(Deno.env.get("DATABASE_URL"))),
});

federation.setActorDispatcher(
  "/users/{identifier}",
  async (ctx, identifier) => {
    const [actor] = await db.select().from(actors).where(
      eq(actors.preferredUsername, identifier),
    );
    if (!actor) return null;

    return new Person({
      id: ctx.getActorUri(identifier),
      preferredUsername: actor.preferredUsername,
      name: actor.name ?? actor.preferredUsername,
      inbox: actor.inbox,
      outbox: actor.outbox,
      summary: actor.summary,
    });
  },
);

export default federation;
