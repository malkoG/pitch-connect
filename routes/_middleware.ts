import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { db } from "../lib/db.ts";
import { accounts } from "../db/schema/account.ts";
import { eq } from "drizzle-orm";
interface State {
  user: { id: string; username: string; email: string; } | null;
}

async function sessionMiddleware(req: Request, ctx: MiddlewareHandlerContext<State>) {
  const cookies = getCookies(req.headers);
  const sessionId = cookies.session;

  ctx.state.user = null;

  if (sessionId) {
    try {
      const [account] = await db.select({
          id: accounts.id,
          username: accounts.username,
          email: accounts.email,
          status: accounts.status
        })
        .from(accounts)
        .where(eq(accounts.id, sessionId))
        .limit(1);

      if (account && account.status === 'active') {
        ctx.state.user = { id: account.id, username: account.username, email: account.email };
      }
    } catch (error) {
      console.error("Error fetching account by session ID:", error);
    }
  }
  return await ctx.next();
}

const fedifyHandler = integrateHandler(federation, () => undefined);

export const handler = [sessionMiddleware, fedifyHandler];
