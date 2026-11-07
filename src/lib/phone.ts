/**
 * Mobile numbers: UAE by default, other GCC countries allowed (country allow-list).
 * Accepts what people type ("050 123 4567", "+971501234567", "00971…", Arabic digits) and returns
 * the international format (E.164, e.g. "+971501234567"), or null when it is not a valid mobile.
 */
export const PHONE_COUNTRIES = [
  { code: "971", iso: "AE", nameEn: "UAE", nameAr: "الإمارات", mobile: /^5\d{8}$/ },
  { code: "966", iso: "SA", nameEn: "Saudi Arabia", nameAr: "السعودية", mobile: /^5\d{8}$/ },
  { code: "965", iso: "KW", nameEn: "Kuwait", nameAr: "الكويت", mobile: /^[569]\d{7}$/ },
  { code: "973", iso: "BH", nameEn: "Bahrain", nameAr: "البحرين", mobile: /^[36]\d{7}$/ },
  { code: "974", iso: "QA", nameEn: "Qatar", nameAr: "قطر", mobile: /^[3567]\d{7}$/ },
  { code: "968", iso: "OM", nameEn: "Oman", nameAr: "عمان", mobile: /^[79]\d{7}$/ },
] as const;

export type PhoneCountryCode = (typeof PHONE_COUNTRIES)[number]["code"];
export const DEFAULT_COUNTRY: PhoneCountryCode = "971";

/** Arabic-Indic / Persian digits → 0-9, everything else that is not a digit or "+" removed. */
function digitsOnly(input: string) {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^\d+]/g, "");
}

export function normalisePhone(input: string, country: string = DEFAULT_COUNTRY): string | null {
  let n = digitsOnly(input ?? "");
  if (!n) return null;
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else {
    // Local format: drop the trunk "0" and add the chosen country code.
    const home = PHONE_COUNTRIES.find((c) => c.code === country);
    if (!home) return null;
    n = home.code + n.replace(/^0/, "");
  }
  if (n.includes("+")) return null;
  const match = PHONE_COUNTRIES.find((c) => n.startsWith(c.code));
  if (!match) return null; // outside the allow-list
  const national = n.slice(match.code.length).replace(/^0/, "");
  return match.mobile.test(national) ? `+${match.code}${national}` : null;
}

/** "+971501234567" → "+971 50 123 4567" (UAE) or "+965 1234 5678" (others). Display only. */
export function formatPhone(e164: string) {
  const c = PHONE_COUNTRIES.find((x) => e164.startsWith(`+${x.code}`));
  if (!c) return e164;
  const n = e164.slice(c.code.length + 1);
  return n.length === 9
    ? `+${c.code} ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`
    : `+${c.code} ${n.slice(0, 4)} ${n.slice(4)}`;
}

/** Hides most digits for messages like "Code sent to +971 50 ••• 4567". */
export const maskPhone = (e164: string) => {
  const f = formatPhone(e164);
  return f.replace(/(\d{2}) (\d{3}) (\d{4})$/, "$1 ••• $3").replace(/ (\d{4}) (\d{4})$/, " •••• $2");
};
