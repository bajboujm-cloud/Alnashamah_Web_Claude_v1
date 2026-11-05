"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";

/** Swaps /ar/... ↔ /en/... on the current page and remembers the choice. */
export function LanguageSwitch({
  locale,
  label,
  ariaLabel,
  onDark = false,
}: {
  locale: Locale;
  label: string;
  ariaLabel: string;
  /** Light text for use on the green admin bar. */
  onDark?: boolean;
}) {
  const pathname = usePathname() ?? `/${locale}`;
  const target: Locale = locale === "ar" ? "en" : "ar";
  const href = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${target}`);

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={ariaLabel}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className={`rounded-brand border border-gold/70 px-3 py-1.5 text-sm hover:bg-gold/15 ${onDark ? "text-ivory" : "text-green"}`}
      data-testid="language-switch"
    >
      {label}
    </Link>
  );
}
