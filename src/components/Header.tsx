import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Container } from "./Container";
import { LanguageSwitch } from "./LanguageSwitch";

export function Header({ locale, t }: { locale: Locale; t: Dictionary }) {
  const links = [
    { href: `/${locale}#categories`, label: t.nav.categories },
    { href: `/${locale}/seasonal/eid-al-adha`, label: t.nav.eid },
    { href: `/${locale}#how`, label: t.nav.howItWorks },
    { href: `/${locale}#faq`, label: t.nav.faq },
  ];
  return (
    <header className="border-b border-gold/50 bg-ivory">
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link href={`/${locale}`} aria-label={`${t.meta.siteName} — ${t.nav.home}`} className="shrink-0">
          <Image
            src="/brand/logo-horizontal.png"
            alt={`${t.meta.siteName} — ${t.meta.tagline}`}
            width={1294}
            height={459}
            priority
            className="h-11 w-auto sm:h-14"
          />
        </Link>
        <nav aria-label={t.nav.menu} className="hidden items-center gap-6 text-sm text-charcoal md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-green hover:underline decoration-gold underline-offset-8"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitch
            locale={locale}
            label={t.nav.switchLanguage}
            ariaLabel={t.nav.switchLanguageLabel}
          />
          <details className="relative md:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-brand border border-line text-green [&::-webkit-details-marker]:hidden">
              <span className="sr-only">{t.nav.menu}</span>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </summary>
            <nav
              aria-label={t.nav.menu}
              className="absolute end-0 z-20 mt-2 w-56 border border-line bg-white p-2"
            >
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-brand px-3 py-3 text-sm hover:bg-ivory"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}
