import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "../src/server/db/client";
import { DATABASE_URL } from "./load-env";

const { db, sql } = createDb(DATABASE_URL, { max: 1 });

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ Database migrations applied");
} finally {
  await sql.end();
}
