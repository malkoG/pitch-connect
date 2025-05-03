import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { signupRequests } from "../models/schema.ts";

const client = postgres(Deno.env.get("DATABASE_URL")!, { max: 1 });
export const db = drizzle(client);

export async function insertSignupRequest({ username, email, intro }: {
  username: string;
  email: string;
  intro?: string;
}) {
  await db.insert(signupRequests).values({
    username,
    email,
    intro: intro || null,
  });
}
