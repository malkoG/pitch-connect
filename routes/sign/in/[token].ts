import { Handlers } from "$fresh/server.ts";
import { consumeSignInToken } from "../../../utils/magic_link.ts";
import { createSession } from "../../../lib/accounts.ts";
import { syncActorFromAccount } from "../../../models/actor.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { token } = ctx.params;

    if (!token) {
      return new Response("Invalid token", { status: 400 });
    }

    // Consume the token and get the account
    const account = await consumeSignInToken(token);

    if (!account) {
      return new Response("Invalid or expired token", { status: 400 });
    }

    await syncActorFromAccount(ctx.state.fedCtx, account);

    // Log the successful signin
    console.log(
      `✅ Signin completed for ${account.username} <${account.email}>`,
    );

    // Create a session and get headers with the session cookie
    const headers = createSession(ctx, account);

    // Redirect to home page
    headers.set("Location", "/");

    return new Response(null, {
      status: 302,
      headers,
    });
  },
};
