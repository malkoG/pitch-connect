import { type Context } from "@fedify/fedify";
import * as vocab from "@fedify/fedify/vocab";
import {
  type Account,
  type Actor,
  actors,
  type Instance,
  instances,
  type NewActor,
  type NewInstance,
} from "./schema.ts";
import { db } from "../lib/db.ts";
import { eq, sql } from "drizzle-orm";
import { generateUuidV7 } from "./uuid.ts";

export async function syncActorFromAccount(
  fedCtx: Context<null>,
  account: Account,
): Promise<
  Actor & {
    account: Account;
    instance: Instance;
  }
> {
  const instance: NewInstance = {
    host: fedCtx.host,
    software: "pitch-connect",
    softwareVersion: "0.0.1",
  };
  const instanceList = await db.insert(instances)
    .values(instance)
    .onConflictDoUpdate({
      target: instances.host,
      set: {
        ...instance,
        updated: sql`CURRENT_TIMESTAMP`,
      },
    })
    .returning();
  const values: Omit<NewActor, "id"> = {
    iri: fedCtx.getActorUri(account.id).href,
    type: "Person",
    username: account.username,
    instanceHost: instance.host,
    handleHost: instance.host,
    preferredUsername: account.username,
    accountId: account.id,
    name: account.username,
    automaticallyApprovesFollowers: true,
    inboxUrl: fedCtx.getInboxUri(account.id).href,
    sharedInboxUrl: fedCtx.getInboxUri().href,
    url: new URL(`/@${account.username}`, fedCtx.origin).href,
    updatedAt: account.updatedAt,
    createdAt: account.createdAt,
    publishedAt: account.createdAt,
  };
  const rows = await db.insert(actors)
    .values({ id: generateUuidV7(), ...values })
    .onConflictDoUpdate({
      target: actors.accountId,
      set: values,
      setWhere: eq(actors.accountId, account.id),
    })
    .returning();
  return { ...rows[0], account, instance: instanceList[0] };
}

export function toRecipient(actor: Actor): vocab.Recipient {
  return {
    id: new URL(actor.iri),
    inboxId: new URL(actor.inboxUrl),
    endpoints: actor.sharedInboxUrl == null ? null : {
      sharedInbox: new URL(actor.sharedInboxUrl),
    },
  };
}
