import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import PostList from "../../islands/PostList.tsx";

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
