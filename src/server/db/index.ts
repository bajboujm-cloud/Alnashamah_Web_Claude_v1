import "server-only";
import { env } from "@/server/env";
import { createDb, type Db } from "./client";

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __nashamahDb?: Db };

export const db: Db = globalForDb.__nashamahDb ?? createDb(env.DATABASE_URL).db;

if (env.NODE_ENV !== "production") globalForDb.__nashamahDb = db;

export * as schema from "./schema";
