import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Container } from "./Container";

export function Footer({ locale, t, whatsapp }: { locale: Locale; t: Dictionary; whatsapp: string | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 bg-green text-ivory">
      <div className="h-1 bg-gold" aria-hidden />
      <Container className="grid gap-8 py-12 sm:grid-cols-2">
        <div>
          <Image
            src="/brand/logo-horizontal-reverse.png"
            alt={`${t.meta.siteName} — ${t.meta.tagline}`}
            width={1294}
            height={459}
            className="h-16 w-auto"
          />
          <p className="mt-4 max-w-sm text-sm text-ivory/80">{t.footer.about}</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp}`}
              className="rounded-brand border border-gold px-4 py-2 text-sm hover:bg-gold hover:text-green-900"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t.footer.contact}
            </a>
          ) : null}
          <a href="https://alnashamah.ae" className="text-sm text-gold" lang="en" dir="ltr">
            alnashamah.ae
          </a>
        </div>
      </Container>
      <div className="border-t border-ivory/15">
        <Container className="flex flex-col justify-between gap-2 py-4 text-xs text-ivory/70 sm:flex-row">
          <span>
            © {year} {locale === "ar" ? "النشامى لتجارة المواشي" : "Al Nashamah Livestock Trading"}.{" "}
            {t.footer.rights}
          </span>
          <span className="label-tracked !text-ivory/60">AL NASHAMAH / LIVESTOCK TRADING</span>
        </Container>
      </div>
    </footer>
  );
}
