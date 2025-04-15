import { Handlers } from "$fresh/server.ts";
import federation from "../../../federation/mod.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const { username } = ctx.params;
    
    try {
      // Get the raw request body for federation processing
      const body = await req.text();
      const contentType = req.headers.get("Content-Type") || "application/json";
      
      // Process the activity using Fedify federation instance
      await federation.handleInboxRequest({
        body,
        contentType,
        targetActorId: username,
        request: req,
      });
      
      return new Response("Activity accepted", { status: 202 });
    } catch (error) {
      console.error("Error processing inbox activity:", error);
      return new Response(`Error processing activity: ${error.message}`, { 
        status: 400 
      });
    }
  },
  
  // Handle GET requests to inbox (usually for verification)
  GET(_req, ctx) {
    const { username } = ctx.params;
    return new Response(JSON.stringify({
      "@context": "https://www.w3.org/ns/activitystreams",
      id: `https://yourdomain/@${username}/inbox`,
      type: "OrderedCollection",
      totalItems: 0,
      // We don't expose inbox contents publicly
      orderedItems: []
    }), {
      headers: { "Content-Type": "application/activity+json" }
    });
  }
};
