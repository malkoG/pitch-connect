import { Handlers } from "$fresh/server.ts";
import { checkSignupTokenValidity, verifySignupToken } from "../../../utils/magic_link.ts";
import { completeSignup, createSession } from "../../../lib/accounts.ts";
import { h } from "preact";

export const handler: Handlers = {
  async GET(_, ctx) {
    const { token } = ctx.params;
    const request = await checkSignupTokenValidity(token);
    if (!request) return ctx.renderNotFound();
    
    return ctx.render({ 
      request,
      token
    });
  },

  async POST(req, ctx) {
    const { token } = ctx.params;
    const request = await verifySignupToken(token);

    if (!request) {
      console.log(`POST /sign/up/${token.substring(0,6)}... : Token invalid, expired, or already consumed.`);
      return new Response("This signup link is invalid or has already been used.", { status: 400 });
    }
    
    const form = await req.formData();

    const account = await completeSignup({ request });

    if (!account) {
      console.error(`completeSignup failed for request ${request.id} after token verification.`);
      return new Response("An error occurred while activating your account.", { status: 500 });
    }

    const sessionHeaders = createSession(ctx, account);
    const responseHeaders = new Headers(sessionHeaders);
    responseHeaders.set("Location", "/");

    return new Response(null, {
      status: 303,
      headers: responseHeaders,
    });
  },
};

export default function SignupCompletePage({ data }) {
  const { request, token } = data;
  
  return (
    <main class="prose max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold mb-4">Complete Your Registration</h1>
      <p class="text-gray-700 mb-4">Welcome, {request.username}! You're almost done.</p>
      
      <form method="post" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              name="email"
              value={request.email}
              disabled
              class="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-100 shadow-sm"
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
              class="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-100 shadow-sm"
            />
          </label>
        </div>
        
        <input type="hidden" name="token" value={token} />
        
        <button class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Complete Registration
        </button>
      </form>
    </main>
  );
}
