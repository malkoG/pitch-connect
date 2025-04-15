import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "../lib/db.ts";
import { posts } from "../models/schema.ts";
import { desc } from "drizzle-orm";
import PostList from "../islands/PostList.tsx";
import PostForm from "../islands/PostForm.tsx";

export const handler: Handlers = {
  async GET(_, ctx) {
    const postList = await db.select().from(posts).orderBy(desc(posts.publishedAt)).limit(20);
    return ctx.render({ posts: postList });
  }
};

export default function Home({ data }: PageProps<{ posts: any[] }>) {
  return (
    <div class="p-4 mx-auto max-w-screen-md">
      <h1 class="text-3xl font-bold mb-4">Micro Timeline</h1>
      <PostForm />
      <PostList posts={data.posts} />
    </div>
  );
}
