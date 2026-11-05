import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { whatsappNumber } from "@/lib/site";

/** Public shop: header, footer and WhatsApp button. The admin panel has its own layout. */
export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return (
    <>
      <Header locale={lang} t={t} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer locale={lang} t={t} whatsapp={whatsappNumber} />
      {whatsappNumber ? <WhatsAppButton number={whatsappNumber} label={t.footer.contact} /> : null}
    </>
  );
}
