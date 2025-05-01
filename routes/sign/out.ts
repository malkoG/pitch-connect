import { Handlers } from "$fresh/server.ts";
import { deleteCookie } from "$std/http/cookie.ts";

export const handler: Handlers = {
  GET(req) {
    const headers = new Headers();

    // Clear the session cookie by setting its expiration date in the past
    deleteCookie(headers, "session", {
      path: "/",
    });

    // Redirect to the home page
    headers.set("Location", "/");

    return new Response(null, {
      status: 302, // Found - temporary redirect
      headers,
    });
  },
};
