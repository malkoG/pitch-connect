import { useState } from "preact/hooks";

export default function PostForm() {
  const [content, setContent] = useState("");

  const submit = async () => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      setContent("");
      location.reload(); // 또는 새 post만 추가하는 방식으로 확장 가능
    } else {
      alert("Failed to post");
    }
  };

  return (
    <div class="mb-4">
      <textarea
        class="w-full p-2 border rounded"
        rows={3}
        placeholder="What's happening?"
        value={content}
        onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
      />
      <button 
        class="mt-2 px-4 py-1 rounded bg-blue-500 text-white" 
        onClick={submit}
        disabled={!content.trim()}
      >
        Post
      </button>
    </div>
  );
}
