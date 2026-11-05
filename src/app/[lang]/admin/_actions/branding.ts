"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import type { FormState } from "@/components/admin/form-state";
import { audit } from "@/server/audit";
import { flag, upload } from "@/server/admin-forms";
import { authorize, NotAllowedError } from "@/server/auth/staff";
import { BRANDING_KEYS } from "@/server/branding";
import { db, schema as s } from "@/server/db";
import { deleteStoredFile } from "@/server/storage";

/** Field name in the form for each setting, e.g. "brand.logo_url" → "logo_url". */
const field = (key: string) => key.replace("brand.", "");

export async function saveBranding(_prev: FormState, data: FormData): Promise<FormState> {
  try {
    const user = await authorize("settings.edit");
    const changes: Record<string, string | null> = {};
    for (const key of BRANDING_KEYS) {
      const [row] = await db.select().from(s.settings).where(eq(s.settings.key, key));
      const current = typeof row?.value === "string" ? row.value : null;
      const uploaded = await upload(data, field(key), "branding", true);
      if (uploaded && !uploaded.ok)
        return { status: "error", msg: uploaded.error, fields: [field(key)], at: Date.now() };
      let next = current;
      if (uploaded?.ok) next = uploaded.url;
      else if (flag(data, `remove_${field(key)}`)) next = null;
      if (next === current) continue;
      if (next)
        await db
          .insert(s.settings)
          .values({ key, value: next })
          .onConflictDoUpdate({ target: s.settings.key, set: { value: next } });
      else await db.delete(s.settings).where(eq(s.settings.key, key));
      await deleteStoredFile(current);
      changes[key] = next;
    }
    if (Object.keys(changes).length) await audit(user, "update", "branding", null, null, changes);
    refresh();
    return { status: "ok", msg: "saved", at: Date.now() };
  } catch (e) {
    if (e instanceof NotAllowedError) return { status: "error", msg: "notAllowed", at: Date.now() };
    console.error(e);
    return { status: "error", msg: "error", at: Date.now() };
  }
}
