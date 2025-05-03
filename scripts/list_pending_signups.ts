import { db } from "../lib/db.ts";
import { eq } from "drizzle-orm";
import { signupRequests } from "../models/schema.ts";

// Check for admin secret if configured
const adminSecret = Deno.env.get("ADMIN_SECRET");
if (adminSecret) {
  const providedSecret = Deno.env.get("ADMIN_SECRET_INPUT");
  if (providedSecret !== adminSecret) {
    console.error(
      "Error: Admin secret required. Set ADMIN_SECRET_INPUT environment variable.",
    );
    Deno.exit(1);
  }
}

const rows = await db.select().from(signupRequests)
  .where(eq(signupRequests.state, "pending"))
  .orderBy(signupRequests.createdAt);

if (rows.length === 0) {
  console.log("No pending requests ✨");
  Deno.exit(0);
}

console.table(rows.map((r) => ({
  id: r.id,
  username: r.username,
  email: r.email,
  created: r.createdAt,
})));
