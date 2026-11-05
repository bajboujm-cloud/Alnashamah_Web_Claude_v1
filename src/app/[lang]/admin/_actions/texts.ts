"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import type { FormState } from "@/components/admin/form-state";
import { getDefaultDictionary } from "@/i18n/dictionaries";
import { EDITABLE_SECTIONS, flatten, type EditableSection } from "@/i18n/overrides";
import { audit } from "@/server/audit";
import { authorize, NotAllowedError } from "@/server/auth/staff";
import { db, schema as s } from "@/server/db";

/** Saves one section of website wording. Text equal to the original (or empty) removes the edit. */
export async function saveTexts(_prev: FormState, data: FormData): Promise<FormState> {
  try {
    const user = await authorize("catalog.content");
    const section = String(data.get("section") ?? "") as EditableSection;
    if (!EDITABLE_SECTIONS.includes(section)) return { status: "error", msg: "error", at: Date.now() };
    const changes: Record<string, string | null> = {};
    for (const locale of ["en", "ar"] as const) {
      const original = flatten((await getDefaultDictionary(locale))[section], section);
      for (const [key, def] of Object.entries(original)) {
        const raw = data.get(`${locale}:${key}`);
        if (raw === null) continue;
        const value = String(raw).trim().slice(0, 2000);
        const where = and(eq(s.siteTexts.key, key), eq(s.siteTexts.locale, locale));
        if (!value || value === def) {
          const removed = await db.delete(s.siteTexts).where(where).returning();
          if (removed.length) changes[`${locale}:${key}`] = null;
        } else {
          const [current] = await db.select().from(s.siteTexts).where(where);
          if (current?.value === value) continue;
          await db
            .insert(s.siteTexts)
            .values({ key, locale, value })
            .onConflictDoUpdate({ target: [s.siteTexts.key, s.siteTexts.locale], set: { value } });
          changes[`${locale}:${key}`] = value;
        }
      }
    }
    if (Object.keys(changes).length) await audit(user, "update", "website-text", section, null, changes);
    refresh();
    return { status: "ok", msg: "saved", at: Date.now() };
  } catch (e) {
    if (e instanceof NotAllowedError) return { status: "error", msg: "notAllowed", at: Date.now() };
    console.error(e);
    return { status: "error", msg: "error", at: Date.now() };
  }
}
