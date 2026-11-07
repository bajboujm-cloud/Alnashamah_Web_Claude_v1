import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Container } from "./Container";
import { HashLink } from "./HashLink";
import { LanguageSwitch } from "./LanguageSwitch";
import { Logo } from "./Logo";

export function Header({
  locale,
  t,
  seasonal,
  logo,
  cartCount,
}: {
  locale: Locale;
  t: Dictionary;
  /** Seasonal offers currently shown on the website (e.g. Eid Al-Adha); hidden ones get no menu link. */
  seasonal: { slug: string; label: string }[];
  logo: string;
  /** Number of animals in the cart. */
  cartCount: number;
}) {
  const links = [
    { href: `/${locale}/livestock`, label: t.nav.categories },
    ...seasonal.map((s) => ({ href: `/${locale}/seasonal/${s.slug}`, label: s.label })),
    { href: `/${locale}#how`, label: t.nav.howItWorks },
    { href: `/${locale}#faq`, label: t.nav.faq },
  ];
  return (
    <header className="border-b border-gold/50 bg-ivory">
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link href={`/${locale}`} aria-label={`${t.meta.siteName} — ${t.nav.home}`} className="shrink-0">
          <Logo src={logo} alt={`${t.meta.siteName} — ${t.meta.tagline}`} priority className="h-11 sm:h-14" />
        </Link>
        <nav aria-label={t.nav.menu} className="hidden items-center gap-6 text-sm text-charcoal md:flex">
          {links.map((l) => (
            <HashLink
              key={l.href}
              href={l.href}
              className="hover:text-green hover:underline decoration-gold underline-offset-8"
            >
              {l.label}
            </HashLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/cart`}
            aria-label={`${t.nav.cart}${cartCount ? ` (${cartCount})` : ""}`}
            className="relative hidden h-11 w-11 items-center justify-center rounded-brand border border-line text-green hover:border-gold md:flex"
            data-testid="header-cart"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <path
                d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            {cartCount ? (
              <span
                className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-green-900"
                data-testid="cart-count"
              >
                {cartCount}
              </span>
            ) : null}
          </Link>
          <Link
            href={`/${locale}/account`}
            aria-label={t.nav.account}
            title={t.nav.account}
            className="hidden h-11 w-11 items-center justify-center rounded-brand border border-line text-green hover:border-gold md:flex"
            data-testid="header-account"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
            </svg>
          </Link>
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
                <HashLink
                  key={l.href}
                  href={l.href}
                  className="block rounded-brand px-3 py-3 text-sm hover:bg-ivory"
                >
                  {l.label}
                </HashLink>
              ))}
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}
