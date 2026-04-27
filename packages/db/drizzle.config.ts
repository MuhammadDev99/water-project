import type { Config } from "drizzle-kit";

// Use the new variable name
if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

export default {
  schema: "./src/schemas",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL // Updated
  },
  casing: "snake_case",
} satisfies Config;