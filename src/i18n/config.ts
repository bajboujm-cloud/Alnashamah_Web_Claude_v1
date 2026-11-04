export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

/** Arabic is the default for visitors whose browser doesn't prefer English. */
export const defaultLocale: Locale = "ar";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const hasLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

export const dirOf = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

/** Picks the English or Arabic field of a bilingual record. */
export function pick<T>(locale: Locale, en: T, ar: T): T {
  return locale === "ar" ? ar : en;
}
