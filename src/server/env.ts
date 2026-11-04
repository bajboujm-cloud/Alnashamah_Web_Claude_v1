import { z } from "zod";

const LOCAL_DATABASE_URL = "postgres://nashamah:nashamah@localhost:5433/nashamah";

const schema = z.object({
  DATABASE_URL: z.string().url().default(LOCAL_DATABASE_URL),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

/** Server-side environment, validated once. Never import this from client components. */
export const env = schema.parse(process.env);
