import { federationRequestHandler } from "@fedify/fedify/x/fresh";
import { Activity } from "@fedify/fedify";
import federation from "../../federation/mod.ts";

// Register a handler for Follow activities
federation.onActivity("Follow", async (activity: Activity, ctx) => {
  const follower = activity.actor; // IRI of remote actor
  const target = activity.object;  // IRI of our local actor

  console.log(`[Follow] ${follower} -> ${target}`);

  // TODO: Store follower relationship in database
  // Example: await db.insert(followers).values({ followerId: follower, targetId: target });

  // Automatically send Accept response to the follower
  await ctx.accept(activity);
});

// Use the Fedify federation request handler
export const handler = federationRequestHandler(federation);
