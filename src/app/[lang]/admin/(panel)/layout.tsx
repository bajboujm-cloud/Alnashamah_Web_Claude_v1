import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav, type NavItem } from "@/components/admin/AdminNav";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { can, type Permission } from "@/server/auth/permissions";
import { requireStaff } from "@/server/auth/staff";
import { logoutAction } from "../_actions/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function PanelLayout({ children, params }: LayoutProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const user = await requireStaff(lang);
  const dict = await getDictionary(lang);
  const t = dict.admin;
  const base = `/${lang}/admin`;

  const all: (NavItem & { perm: Permission })[] = [
    { href: base, label: t.nav.dashboard, perm: "dashboard.view" },
    { href: `${base}/breeds`, label: t.nav.breeds, perm: "dashboard.view" },
    { href: `${base}/categories`, label: t.nav.categories, perm: "catalog.content" },
    { href: `${base}/seasonal`, label: t.nav.seasonal, perm: "catalog.content" },
    { href: `${base}/cutting`, label: t.nav.cutting, perm: "catalog.content" },
    { href: `${base}/extras`, label: t.nav.extras, perm: "catalog.content" },
    { href: `${base}/packaging`, label: t.nav.packaging, perm: "catalog.content" },
    { href: `${base}/settings`, label: t.nav.settings, perm: "settings.edit" },
    { href: `${base}/staff`, label: t.nav.staff, perm: "staff.manage" },
    { href: `${base}/audit`, label: t.nav.audit, perm: "audit.view" },
    { href: `${base}/account`, label: t.nav.account, perm: "dashboard.view" },
  ];
  const items = all.filter((i) => can(user.role, i.perm)).map(({ href, label }) => ({ href, label }));

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-clip md:flex-row">
      <aside className="bg-green text-ivory md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
        <div className="flex items-center justify-between gap-2 border-b border-ivory/15 px-4 py-3">
          <Link href={base} aria-label={t.title}>
            <Image
              src="/brand/logo-horizontal-reverse.png"
              alt={t.title}
              width={1294}
              height={459}
              className="h-10 w-auto"
            />
          </Link>
          <div className="md:hidden">
            <LanguageSwitch
              onDark
              locale={lang}
              label={dict.nav.switchLanguage}
              ariaLabel={dict.nav.switchLanguageLabel}
            />
          </div>
        </div>
        <div className="px-2 py-2 md:py-4">
          <AdminNav items={items} />
        </div>
        <div className="hidden space-y-2 border-t border-ivory/15 px-4 py-4 text-sm md:block">
          <p className="text-ivory/70">
            {user.name} · {t.staff.roles[user.role]}
          </p>
          <LanguageSwitch
            onDark
            locale={lang}
            label={dict.nav.switchLanguage}
            ariaLabel={dict.nav.switchLanguageLabel}
          />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-gold/50 bg-ivory px-4 py-3 sm:px-6">
          <p className="label-tracked">{t.title}</p>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/${lang}`} className="text-gold-deep underline" target="_blank">
              {t.viewSite}
            </Link>
            <form action={logoutAction}>
              <input type="hidden" name="lang" value={lang} />
              <button className="rounded-brand border border-line px-3 py-1.5 text-green hover:border-gold">
                {t.signOut}
              </button>
            </form>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
