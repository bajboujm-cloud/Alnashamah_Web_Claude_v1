import type { Locale } from "@/i18n/config";

/** Western digits in both languages (the UAE norm); Arabic uses the "د.إ" symbol. */
const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE");

export function formatAed(fils: number, locale: Locale): string {
  const amount = fils / 100;
  const number = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return locale === "ar" ? `${number} د.إ` : `AED ${number}`;
}

function formatNumber(n: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 }).format(n);
}

/** "12–15" / "12+" / "≤ 15" / null when nothing is set. */
export function formatRange(min: number | null, max: number | null, locale: Locale): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null)
    return min === max
      ? formatNumber(min, locale)
      : `${formatNumber(min, locale)}–${formatNumber(max, locale)}`;
  if (min != null) return `${formatNumber(min, locale)}+`;
  return `≤ ${formatNumber(max as number, locale)}`;
}

/** Arabic month noun agrees with the number: 3–10 → أشهر, otherwise شهر/شهراً. */
export function monthsUnit(max: number | null, min: number | null, locale: Locale) {
  if (locale === "en") return "months";
  const n = max ?? min ?? 0;
  if (n >= 3 && n <= 10) return "أشهر";
  if (n >= 11) return "شهراً";
  return "شهر";
}

export function formatAge(min: number | null, max: number | null, locale: Locale) {
  const range = formatRange(min, max, locale);
  return range ? `${range} ${monthsUnit(max, min, locale)}` : null;
}

export function formatWeight(min: number | null, max: number | null, locale: Locale) {
  const range = formatRange(min, max, locale);
  return range ? `${range} ${locale === "ar" ? "كجم" : "kg"}` : null;
}
