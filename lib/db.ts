import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres(Deno.env.get("DATABASE_URL")!, { max: 1 });
export const db = drizzle(client);
