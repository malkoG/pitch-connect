/** routes/sign/up/index.tsx */
import { Handlers, PageProps } from "$fresh/server.ts";
import { h } from "preact";
import { insertSignupRequest } from "../../../lib/db.ts";
import { sendRequestReceivedMail } from "../../../mail/signup_request_received.ts";

interface Data {
  errors?: { username?: string; email?: string; intro?: string; general?: string };
  defaultValues?: { username?: string; email?: string; intro?: string };
}

export const handler: Handlers<Data> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const username = form.get("username")?.toString().trim();
    const email    = form.get("email")?.toString().trim();
    const intro    = (form.get("intro")  ?? "").toString().trim();

    const errors: Data["errors"] = {};
    if (!username) errors.username = "Username is required";
    if (!email?.match(/^[^@]+@[^@]+$/)) errors.email = "Invalid e‑mail";
    if (intro.length > 280) errors.intro = "Intro is too long (280 char max)";
    if (Object.keys(errors).length) return ctx.render({ errors, defaultValues: { username, email, intro } });

    await insertSignupRequest({ username, email, intro });
    sendRequestReceivedMail({ username, email });
    return new Response(null, { status: 303, headers: { location: "/sign/up/sent" } });
  },
};

export default function Page({ data }: PageProps<Data>) {
  const { errors = {}, defaultValues = {} } = data ?? {};
  return (
    <main class="prose max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold mb-6 text-center">Request an account</h1>
      <form method="post" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Username
            <input
              type="text"
              name="username"
              value={defaultValues.username || ""}
              class={`mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 ${errors.username ? 'border-red-500' : ''}`}
            />
          </label>
          {errors.username && <span class="text-red-500 text-sm mt-1">{errors.username}</span>}
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              name="email"
              value={defaultValues.email || ""}
              class={`mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 ${errors.email ? 'border-red-500' : ''}`}
            />
          </label>
          {errors.email && <span class="text-red-500 text-sm mt-1">{errors.email}</span>}
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Introduction (optional)
            <textarea
              name="intro"
              rows={3}
              value={defaultValues.intro || ""}
              class={`mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 ${errors.intro ? 'border-red-500' : ''}`}
              placeholder="Tell us a bit about yourself and why you'd like to join..."
            ></textarea>
          </label>
          {errors.intro && <span class="text-red-500 text-sm mt-1">{errors.intro}</span>}
        </div>
        
        {errors.general && <div class="text-red-500">{errors.general}</div>}
        
        <button class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Request access</button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600">
        이미 계정이 있으신가요? <a href="/sign/in" class="text-blue-600 hover:underline">로그인</a>
      </p>
    </main>
  );
}
