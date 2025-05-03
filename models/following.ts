import { type Context, Follow, Reject, Undo } from "@fedify/fedify";
import { and, eq, isNull, sql } from "drizzle-orm";
import { toRecipient } from "./actor.ts";
import {
  type Account,
  type Actor,
  actors,
  type Following,
  followings,
} from "./schema.ts";
import type { Uuid } from "./uuid.ts";
import { db } from "../lib/db.ts";

export function createFollowingIri(
  fedCtx: Context<null>,
  follower: Account,
): URL {
  return new URL(
    `#follow/${crypto.randomUUID()}`,
    fedCtx.getActorUri(follower.id),
  );
}

export async function follow(
  fedCtx: Context<null>,
  follower: Account & { actor: Actor },
  followee: Actor,
): Promise<Following | undefined> {
  const rows = await db.insert(followings).values({
    iri: createFollowingIri(fedCtx, follower).href,
    followerId: follower.actor.id,
    followeeId: followee.id,
    accepted: followee.accountId == null ? null : sql`CURRENT_TIMESTAMP`,
  }).onConflictDoNothing().returning();
  if (rows.length > 0 && followee.accountId == null) {
    await fedCtx.sendActivity(
      { identifier: follower.id },
      toRecipient(followee),
      new Follow({
        id: new URL(rows[0].iri),
        actor: fedCtx.getActorUri(follower.id),
        object: new URL(followee.iri),
      }),
      { excludeBaseUris: [new URL(fedCtx.origin)] },
    );
  } else if (rows.length > 0 && followee.accountId != null) {
    await updateFolloweesCount(rows[0].followerId, 1);
    await updateFollowersCount(rows[0].followeeId, 1);
  }
  return rows[0];
}

export async function acceptFollowing(
  iri: string | URL,
): Promise<Following | undefined>;
export async function acceptFollowing(
  follower: Account & { actor: Actor },
  followee: Actor,
): Promise<Following | undefined>;
export async function acceptFollowing(
  iriOrFollower: string | URL | Account & { actor: Actor },
  followee?: Actor,
): Promise<Following | undefined> {
  let rows: Following[];
  if (typeof iriOrFollower === "string" || iriOrFollower instanceof URL) {
    const iri = iriOrFollower.toString();
    rows = await db.update(followings).set({
      accepted: sql`CURRENT_TIMESTAMP`,
    }).where(and(
      eq(followings.iri, iri),
      isNull(followings.accepted),
    )).returning();
  } else if (followee == null) {
    return undefined;
  } else {
    const follower = iriOrFollower;
    rows = await db.update(followings).set({
      accepted: sql`CURRENT_TIMESTAMP`,
    }).where(
      and(
        eq(followings.followerId, follower.actor.id),
        eq(followings.followeeId, followee.id),
        isNull(followings.accepted),
      ),
    ).returning();
  }
  if (rows.length > 0) {
    await updateFolloweesCount(rows[0].followerId, 1);
    await updateFollowersCount(rows[0].followeeId, 1);
  }
  return rows[0];
}

export async function unfollow(
  fedCtx: Context<null>,
  follower: Account & { actor: Actor },
  followee: Actor,
): Promise<Following | undefined> {
  const rows = await db.delete(followings).where(
    and(
      eq(followings.followerId, follower.actor.id),
      eq(followings.followeeId, followee.id),
    ),
  ).returning();
  if (rows.length > 0 && followee.accountId == null) {
    await fedCtx.sendActivity(
      { identifier: follower.id },
      toRecipient(followee),
      new Undo({
        actor: fedCtx.getActorUri(follower.id),
        object: new Follow({
          id: new URL(rows[0].iri),
          actor: fedCtx.getActorUri(follower.id),
          object: new URL(followee.iri),
        }),
      }),
      { excludeBaseUris: [new URL(fedCtx.origin)] },
    );
  }
  if (rows.length > 0) {
    await updateFolloweesCount(rows[0].followerId, -1);
    await updateFollowersCount(rows[0].followeeId, -1);
  }
  return rows[0];
}

export async function removeFollower(
  fedCtx: Context<null>,
  followee: Account & { actor: Actor },
  follower: Actor,
): Promise<Following | undefined> {
  const rows = await db.delete(followings).where(
    and(
      eq(followings.followerId, follower.id),
      eq(followings.followeeId, followee.actor.id),
    ),
  ).returning();
  if (rows.length < 1) return undefined;
  await updateFolloweesCount(rows[0].followerId, -1);
  await updateFollowersCount(rows[0].followeeId, -1);
  if (follower.accountId == null) {
    await fedCtx.sendActivity(
      { identifier: followee.id },
      toRecipient(follower),
      new Reject({
        id: new URL(
          `/#reject/${followee.id}/${follower.id}/${rows[0].iri}`,
          fedCtx.getActorUri(followee.id),
        ),
        actor: fedCtx.getActorUri(followee.id),
        object: new Follow({
          id: new URL(rows[0].iri),
          actor: new URL(follower.iri),
          object: fedCtx.getActorUri(followee.id),
        }),
      }),
    );
  }
  return rows[0];
}

export async function updateFolloweesCount(
  followerId: Uuid,
  delta: number,
): Promise<Actor | undefined> {
  const rows = await db.update(actors).set({
    followeesCount: sql`
      CASE WHEN ${actors.accountId} IS NULL
        THEN ${actors.followeesCount} + ${delta}
        ELSE (
          SELECT count(*)
          FROM ${followings}
          WHERE ${followings.followerId} = ${followerId}
            AND ${followings.accepted} IS NOT NULL
        )
      END
    `,
  }).where(eq(actors.id, followerId)).returning();
  return rows[0];
}

export async function updateFollowersCount(
  followeeId: Uuid,
  delta: number,
): Promise<Actor | undefined> {
  const rows = await db.update(actors).set({
    followersCount: sql`
      CASE WHEN ${actors.accountId} IS NULL
        THEN ${actors.followersCount} + ${delta}
        ELSE (
          SELECT count(*)
          FROM ${followings}
          WHERE ${followings.followeeId} = ${followeeId}
            AND ${followings.accepted} IS NOT NULL
        )
      END
    `,
  }).where(eq(actors.id, followeeId)).returning();
  return rows[0];
}
