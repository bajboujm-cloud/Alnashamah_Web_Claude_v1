import type { Locale } from "@/i18n/config";

/** "2026-11-09" → "Monday, 9 November" / "الاثنين، 9 نوفمبر" (Western digits, as in the rest of the site). */
export function formatDay(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
