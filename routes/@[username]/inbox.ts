import federation from "../../federation/mod.ts";

export const handler = async (req: Request) => {
  return federation.handleRequest(req);
};
