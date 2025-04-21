import { Handlers } from "$fresh/server.ts";
import { consumeSignInToken } from "../../../utils/magic_link.ts";

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
    
    // Log the successful signin
    console.log(`✅ Signin completed for ${account.username} <${account.email}>`);
    
    // Create a session (simplified for now)
    // In a real app, you would use a proper session management system
    const headers = new Headers();
    headers.set("Set-Cookie", `session=${account.id}; Path=/; HttpOnly; SameSite=Strict`);
    
    // Redirect to home page
    headers.set("Location", "/");
    
    return new Response(null, {
      status: 302,
      headers,
    });
  }
};
