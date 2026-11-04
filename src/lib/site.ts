import { locales, type Locale } from "@/i18n/config";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** WhatsApp number (digits only) or null to hide the button. */
export const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "") || null;

/** hreflang alternates for a path without the locale prefix, e.g. "/sheep/naeemi". */
export function alternates(locale: Locale, path = "") {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(locales.map((l) => [l === "ar" ? "ar-AE" : "en-AE", `/${l}${path}`])),
      "x-default": `/ar${path}`,
    },
  };
}
