import { getLogger } from "@logtape/logtape";
import federation from "../../federation/mod.ts";

const logger = getLogger("pitch-connect");

export const handler = async (req: Request) => {
  try {
    const activity = await req.json();
    await federation.receive(activity); // dispatches to onActivity handlers
    return new Response("OK", { status: 202 });
  } catch (err) {
    logger.error("Inbox error", err);
    return new Response("Bad Request", { status: 400 });
  }
};
