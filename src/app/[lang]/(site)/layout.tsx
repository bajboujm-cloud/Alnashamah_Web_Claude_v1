import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isSeasonVisible } from "@/lib/availability";
import { getBranding } from "@/server/branding";
import { getCartCount } from "@/server/cart";
import { getSeasonalCollections } from "@/server/catalog";

/** Menu label: the part before " / " (e.g. "Eid Al-Adha Sacrifice / Qurban" → "Eid Al-Adha Sacrifice"). */
const shortName = (name: string) => name.split(" / ")[0];

/** Public shop: header, footer and WhatsApp button. The admin panel has its own layout. */
export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, seasons, brand, cartCount] = await Promise.all([
    getDictionary(lang),
    getSeasonalCollections(),
    getBranding(),
    getCartCount(),
  ]);
  const seasonal = seasons
    .filter((s) => isSeasonVisible(s))
    .map((s) => ({ slug: s.slug, label: shortName(pick(lang, s.nameEn, s.nameAr)) }));
  return (
    <>
      <Header locale={lang} t={t} seasonal={seasonal} logo={brand.logo} cartCount={cartCount} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer locale={lang} t={t} whatsapp={brand.whatsapp} logo={brand.logoReverse} />
      {brand.whatsapp ? <WhatsAppButton number={brand.whatsapp} label={t.footer.contact} /> : null}
    </>
  );
}
