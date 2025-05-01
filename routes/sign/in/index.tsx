/** routes/sign/in/index.tsx */
import { Handlers, PageProps } from "$fresh/server.ts";
import { h } from "preact";
import { createSignInLink } from "../../../utils/magic_link.ts";
import { db } from "../../../lib/db.ts";
import { accounts } from "../../../db/schema/account.ts";
import { eq } from "drizzle-orm";

interface Data {
  errors?: { email?: string; general?: string };
  defaultValues?: { email?: string };
}

export const handler: Handlers<Data> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const email = form.get("email")?.toString().trim();

    const errors: Data["errors"] = {};
    if (!email?.match(/^[^@]+@[^@]+$/)) errors.email = "Invalid e‑mail";
    if (Object.keys(errors).length) return ctx.render({ errors, defaultValues: { email } });

    // Find the account with this email
    const account = await db.select().from(accounts)
      .where(eq(accounts.email, email))
      .limit(1)
      .then(rows => rows[0] || null);

    if (account) {
      // Generate a signin link
      const signInUrl = await createSignInLink(account.id);

      // In a real app, send an email with the link
      console.log(`📧 Signin link for ${account.username} <${account.email}>:`);
      console.log(signInUrl.toString());
    }

    // Always redirect to the "sent" page, even if account not found
    // This prevents email enumeration attacks
    return new Response(null, { status: 303, headers: { location: "/sign/in/sent" } });
  },
};

export default function Page({ data }: PageProps<Data>) {
  const { errors = {}, defaultValues = {} } = data ?? {};
  return (
    <main class="prose max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold mb-6 text-center">Sign in</h1>
      <form method="post" class="space-y-4">
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
        
        {errors.general && <div class="text-red-500">{errors.general}</div>}
        
        <button class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Send sign-in link</button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600">
        아직 계정이 없으신가요? <a href="/sign/up" class="text-blue-600 hover:underline">회원가입</a>
      </p>
    </main>
  );
}
