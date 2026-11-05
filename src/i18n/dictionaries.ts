import "server-only";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/server/db";
import type { Locale } from "./config";
import type en from "./dictionaries/en.json";
import { applyOverrides } from "./overrides";

export type Dictionary = typeof en;

const defaults: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  ar: () => import("./dictionaries/ar.json").then((m) => m.default),
};

/** Built-in texts only (used by the "Website text" editor to show the original wording). */
export const getDefaultDictionary = (locale: Locale) => defaults[locale]();

/** Website texts: the built-in wording with any edits made in the admin panel applied on top. */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const base = await defaults[locale]();
  try {
    const rows = await db
      .select({ key: s.siteTexts.key, value: s.siteTexts.value })
      .from(s.siteTexts)
      .where(eq(s.siteTexts.locale, locale));
    return rows.length ? applyOverrides(base, Object.fromEntries(rows.map((r) => [r.key, r.value]))) : base;
  } catch {
    // Database not reachable (e.g. during a build): fall back to the built-in wording.
    return base;
  }
}
