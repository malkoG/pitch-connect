/** routes/sign/in/index.tsx */
import { Handlers, PageProps } from "$fresh/server.ts";
import { h } from "preact";
import { createMagicLink } from "../../../utils/magic_link.ts";
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
      // Generate a signin token
      const token = await createMagicLink({
        type: "signin",
        accountId: account.id,
        expiresInMinutes: 15, // Short expiry for security
      });

      // In a real app, send an email with the token
      console.log(`📧 Signin link for ${account.username} <${account.email}>:`);
      console.log(`http://localhost:8000/sign/in/${token}`);
    }

    // Always redirect to the "sent" page, even if account not found
    // This prevents email enumeration attacks
    return new Response(null, { status: 303, headers: { location: "/sign/in/sent" } });
  },
};

export default function Page({ data }: PageProps<Data>) {
  const { errors = {}, defaultValues = {} } = data ?? {};
  return (
    <main class="prose mx-auto p-4">
      <h1>Sign in</h1>
      <form method="post" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              name="email"
              value={defaultValues.email || ""}
              class={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${errors.email ? 'border-red-500' : ''}`}
            />
          </label>
          {errors.email && <span class="text-red-500 text-sm">{errors.email}</span>}
        </div>
        
        {errors.general && <div class="text-red-500">{errors.general}</div>}
        
        <button class="px-4 py-2 bg-blue-600 text-white rounded">Send sign-in link</button>
      </form>
    </main>
  );
}
