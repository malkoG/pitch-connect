import { FreshContext, Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getLogger } from "@logtape/logtape";
import { db } from "../../lib/db.ts";
import { accounts, actors } from "../../models/schema.ts";
import { posts } from "../../models/schema.ts";
import { eq, desc } from "drizzle-orm";
import PostList from "../../islands/PostList.tsx";

const logger = getLogger("pitch-connect");

interface ProfileData {
  account: {
    id: string;
    username: string;
    intro: string | null;
    createdAt: Date;
  };
  posts: Array<{
    id: string;
    content: string;
    publishedAt: Date;
  }>;
}

export const handler: Handlers<ProfileData | null> = {
  async GET(req: Request, ctx: FreshContext<any, ProfileData | null>) {
    const { username } = ctx.params;
    logger.debug("Request for user profile:", username);

    const acceptHeader = req.headers.get("Accept") || "";
    const wantsActivityJson =
      acceptHeader.includes("application/activity+json") ||
      acceptHeader.includes("application/ld+json");

    if (wantsActivityJson) {
      const [actor] = await db.select().from(actors).where(
        eq(actors.preferredUsername, username),
      );

      if (!actor) {
        return new Response("Actor not found", { status: 404 });
      }

      const url = new URL(req.url);
      const host = url.hostname;
      const actorUrl = `https://${host}/@${username}`;

      return Response.json({
        "@context": [
          "https://www.w3.org/ns/activitystreams",
          "https://w3id.org/security/v1",
        ],
        "id": actorUrl,
        "type": "Person",
        "preferredUsername": username,
        "name": actor.name ?? actor.preferredUsername,
        "summary": actor.summary || "",
        "inbox": actor.inbox || `${actorUrl}/inbox`,
        "outbox": actor.outbox || `${actorUrl}/outbox`,
      }, {
        headers: {
          "Content-Type": "application/activity+json",
          "Cache-Control": "max-age=3600",
        },
      });
    }

    const [accountData] = await db.select({
        id: accounts.id,
        username: accounts.username,
        intro: accounts.intro,
        createdAt: accounts.createdAt
      })
      .from(accounts)
      .where(eq(accounts.username, username))
      .limit(1);

    if (!accountData) {
      logger.warn("Account not found for username:", username);
      return ctx.renderNotFound();
    }

    const userPosts = await db.select({
        id: posts.id,
        content: posts.content,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.actorId, accountData.id))
      .orderBy(desc(posts.publishedAt));

    return ctx.render({ account: accountData, posts: userPosts });
  },
};

export default function UserProfilePage({ data }: PageProps<ProfileData>) {
  const { account, posts } = data;

  return (
    <>
      <Head>
        <title>{account.username}'s Profile</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md space-y-6">
        <div>
          <h1 class="text-3xl font-bold mb-1">{account.username}</h1>
          {account.intro ? (
            <p class="text-lg text-gray-700">{account.intro}</p>
          ) : (
            <p class="text-lg text-gray-500 italic">No introduction provided.</p>
          )}
        </div>

        <hr />

        <div>
          <h2 class="text-2xl font-semibold mb-4">Posts</h2>
          {posts.length > 0 ? (
            <PostList posts={posts} />
          ) : (
            <p class="text-gray-600">@{account.username} hasn't posted yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
