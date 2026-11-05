import { z } from "zod";

const LOCAL_DATABASE_URL = "postgres://nashamah:nashamah@localhost:5433/nashamah";
/** Development-only fallback so the app runs with zero setup on a laptop. Never used in production. */
const DEV_AUTH_SECRET = "dev-only-insecure-secret-change-me-0123456789abcdef";

const schema = z
  .object({
    DATABASE_URL: z.string().url().default(LOCAL_DATABASE_URL),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    AUTH_SECRET: z.string().min(32).optional(),
    STORAGE_DIR: z.string().default(".storage"),
  })
  .transform((e) => {
    if (!e.AUTH_SECRET && e.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build")
      throw new Error("AUTH_SECRET is required in production (at least 32 random characters).");
    return { ...e, AUTH_SECRET: e.AUTH_SECRET ?? DEV_AUTH_SECRET };
  });

/** Server-side environment, validated once. Never import this from client components. */
export const env = schema.parse(process.env);
