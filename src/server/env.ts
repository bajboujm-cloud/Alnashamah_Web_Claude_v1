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
    /** Login codes: "console" prints them in the terminal (laptop); "twilio" sends real SMS (go-live). */
    OTP_PROVIDER: z.enum(["console", "twilio"]).default("console"),
    /** Show the code on screen too (console provider only — for laptop testing and automated tests). */
    OTP_SHOW_CODE: z
      .enum(["true", "false", ""])
      .optional()
      .transform((v) => v === "true"),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
    /** Cloudflare Turnstile bot check. Empty = no bot check (laptop only). */
    TURNSTILE_SECRET_KEY: z.string().optional(),
    /** Login codes one internet address (IP) may request per hour. */
    OTP_IP_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(30),
  })
  .transform((e) => {
    if (!e.AUTH_SECRET && e.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build")
      throw new Error("AUTH_SECRET is required in production (at least 32 random characters).");
    if (
      e.OTP_PROVIDER === "twilio" &&
      !(e.TWILIO_ACCOUNT_SID && e.TWILIO_AUTH_TOKEN && e.TWILIO_VERIFY_SERVICE_SID)
    )
      throw new Error(
        "OTP_PROVIDER=twilio needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID.",
      );
    return { ...e, AUTH_SECRET: e.AUTH_SECRET ?? DEV_AUTH_SECRET };
  });

/** Server-side environment, validated once. Never import this from client components. */
export const env = schema.parse(process.env);
