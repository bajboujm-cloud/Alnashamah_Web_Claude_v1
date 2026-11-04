/** Loads `.env.local` for command-line scripts (Next.js does this itself for the app). */
try {
  process.loadEnvFile(".env.local");
} catch {
  // optional
}

export const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://nashamah:nashamah@localhost:5433/nashamah";
