import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || typeof DATABASE_URL !== "string") {
  throw new Error("Missing or invalid DATABASE_URL environment variable.");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./models/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
