import { Handlers } from "$fresh/server.ts";
import { verifySignupToken } from "../../../utils/magic_link.ts";
import { completeSignup } from "../../../lib/accounts.ts";
import { h } from "preact";

export const handler: Handlers = {
  async GET(_, ctx) {
    const { token } = ctx.params;
    const request = await verifySignupToken(token);
    if (!request) return ctx.renderNotFound();
    
    return ctx.render({ 
      request,
      token
    });
  },

  async POST(req, ctx) {
    const { token } = ctx.params;
    const request = await verifySignupToken(token);
    if (!request) return ctx.renderNotFound();
    
    const form = await req.formData();
    const password = form.get("password")?.toString();
    
    await completeSignup({ request, password });
    
    return new Response(null, { 
      status: 303, 
      headers: { location: "/" } 
    });
  },
};

export default function SignupCompletePage({ data }) {
  const { request, token } = data;
  
  return (
    <main class="prose mx-auto p-4">
      <h1>Complete Your Registration</h1>
      <p>Welcome, {request.username}! You're almost done.</p>
      
      <form method="post" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              name="email"
              value={request.email}
              disabled
              class="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
            />
          </label>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Username
            <input
              type="text"
              name="username"
              value={request.username}
              disabled
              class="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
            />
          </label>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Password
            <input
              type="password"
              name="password"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </label>
        </div>
        
        <input type="hidden" name="token" value={token} />
        
        <button class="px-4 py-2 bg-blue-600 text-white rounded">
          Complete Registration
        </button>
      </form>
    </main>
  );
}
