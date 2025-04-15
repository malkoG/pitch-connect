import { createFederation, Person } from "@fedify/fedify";
import { getLogger } from "@logtape/logtape";
import { PostgresKvStore, PostgresMessageQueue } from "@fedify/postgres";
import postgres from "postgres";

const logger = getLogger("pitch-connect");

const federation = createFederation({
  kv: new PostgresKvStore(postgres(Deno.env.get("DATABASE_URL"))),
  queue: new PostgresMessageQueue(postgres(Deno.env.get("DATABASE_URL"))),
});

federation.setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
  return new Person({
    id: ctx.getActorUri(identifier),
    preferredUsername: identifier,
    name: identifier,
  });
});

export default federation;
