import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || typeof DATABASE_URL !== "string") {
  throw new Error("Missing or invalid DATABASE_URL environment variable.");
}

// Validate that the URL has the expected format
try {
  const url = new URL(DATABASE_URL);
  console.log("Database connection info:");
  console.log(`- Host: ${url.hostname}`);
  console.log(`- Port: ${url.port}`);
  console.log(`- Username: ${url.username}`);
  console.log(`- Password: ${url.password ? "****" : "NOT SET"}`);
  console.log(`- Database: ${url.pathname.substring(1)}`);
  
  if (!url.password) {
    console.warn("WARNING: No password set in DATABASE_URL");
  }
} catch (error) {
  throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
}

export default defineConfig({
  out: "./drizzle",
  schema: "./models/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
