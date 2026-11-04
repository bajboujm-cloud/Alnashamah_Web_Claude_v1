import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/** Creates a Drizzle client. Used by the app (singleton below) and by scripts. */
export function createDb(url: string, options: { max?: number } = {}) {
  const sql = postgres(url, { max: options.max ?? 10, prepare: false, onnotice: () => {} });
  return { db: drizzle(sql, { schema, casing: "snake_case" }), sql };
}

export type Db = ReturnType<typeof createDb>["db"];
