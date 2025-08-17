import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Use postgres-js for database connection
// Disable SSL for Docker development, enable for production
const queryClient = postgres(process.env.DATABASE_URL, {
  prepare: false,
  ssl: process.env.DOCKER_ENV === 'true' ? false : 'require'
});

export const db = drizzle(queryClient, { schema });