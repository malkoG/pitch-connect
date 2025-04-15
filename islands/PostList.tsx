export default function PostList({ posts }: { posts: any[] }) {
  return (
    <ul class="space-y-2">
      {posts.map((post) => (
        <li class="border p-2 rounded shadow bg-white" key={post.id}>
          <p class="text-sm text-gray-500">{new Date(post.publishedAt).toLocaleString()}</p>
          <p>{post.content}</p>
        </li>
      ))}
    </ul>
  );
}
