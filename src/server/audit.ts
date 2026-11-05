import "server-only";
import { db, schema as s } from "@/server/db";

/** Records who changed what. Every admin change must call this. */
export async function audit(
  actor: { email: string } | null,
  action: string,
  entity: string,
  entityId: string | null,
  before?: unknown,
  after?: unknown,
) {
  await db.insert(s.auditLog).values({
    actor: actor?.email ?? null,
    action,
    entity,
    entityId,
    before: before ?? null,
    after: after ?? null,
  });
}
