import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedCard } from "@/components/BreedCard";
import { CategoryCard } from "@/components/CategoryCard";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isSeasonVisible } from "@/lib/availability";
import { PromoSlider } from "@/components/PromoSlider";
import { getBranding } from "@/server/branding";
import {
  getActivePromotions,
  getFeaturedBreeds,
  getSeasonalCollections,
  getVisibleCategories,
} from "@/server/catalog";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, categories, breeds, seasons, brand, promos] = await Promise.all([
    getDictionary(lang),
    getVisibleCategories(),
    getFeaturedBreeds(8),
    getSeasonalCollections(),
    getBranding(),
    getActivePromotions(),
  ]);
  const activeSeasons = seasons.filter((s) => isSeasonVisible(s));
  const nameOf = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? pick(lang, c.nameEn, c.nameAr) : undefined;
  };

  return (
    <>
      <PromoSlider
        rtl={lang === "ar"}
        labels={{
          region: t.home.promoLabel,
          prev: t.home.promoPrev,
          next: t.home.promoNext,
          goTo: t.home.promoGoTo,
        }}
        slides={promos.map((p) => ({
          id: p.id,
          title: pick(lang, p.titleEn, p.titleAr),
          text: pick(lang, p.textEn, p.textAr),
          image: p.imageUrl,
          imageMobile: p.imageMobileUrl,
          button: pick(lang, p.buttonEn, p.buttonAr),
          link: p.linkUrl,
        }))}
      />

      {/* Hero */}
      <section className="brand-pattern relative overflow-hidden bg-green text-ivory">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-gold" aria-hidden />
        <Container className="grid grid-cols-[1fr_6.5rem] items-center gap-4 py-6 sm:grid-cols-1 sm:gap-10 sm:py-20 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="label-tracked !text-gold">{t.home.heroEyebrow}</p>
            <h1 className="font-display mt-2 text-2xl leading-tight sm:mt-4 sm:text-5xl">
              {t.home.heroTitle}
            </h1>
            {/* On phones the welcome stays short so the Eid banner and categories show on the first screen. */}
            <div className="mt-6 hidden h-px w-24 bg-gold sm:block" aria-hidden />
            <p className="mt-6 hidden max-w-xl text-ivory/85 sm:block">{t.home.heroText}</p>
            <div className="mt-4 flex flex-wrap gap-3 sm:mt-8">
              <Link
                href={`/${lang}#categories`}
                className="rounded-brand bg-gold px-4 py-2 text-sm font-semibold text-green-900 hover:bg-ivory sm:px-6 sm:py-3 sm:text-base"
              >
                {t.home.heroCta}
              </Link>
              <Link
                href={`/${lang}#how`}
                className="hidden rounded-brand border border-ivory/40 px-6 py-3 text-ivory hover:border-gold sm:inline-block"
              >
                {t.home.heroSecondary}
              </Link>
            </div>
          </div>
          <Image
            src={brand.heroImage}
            alt=""
            width={442}
            height={229}
            priority
            unoptimized={brand.heroImage.endsWith(".svg")}
            className="mx-auto h-auto max-h-72 w-full max-w-[6.5rem] object-contain sm:max-w-sm"
          />
        </Container>
      </section>

      {/* Seasonal banner */}
      {activeSeasons.map((s) => (
        <section key={s.id} className="border-b border-gold/50 bg-white">
          <Container className="grid grid-cols-[4.5rem_1fr] items-center gap-x-3 gap-y-3 py-4 sm:grid-cols-[auto_1fr_auto] sm:gap-6 sm:py-8">
            {s.illustrationUrl ? (
              <Image
                src={s.illustrationUrl}
                alt=""
                width={240}
                height={160}
                className="h-auto w-[4.5rem] sm:w-40"
              />
            ) : null}
            <div>
              <p className="label-tracked">{t.home.seasonalLabel}</p>
              <h2 className="font-display mt-1 text-lg text-green sm:text-2xl">
                {pick(lang, s.nameEn, s.nameAr)}
              </h2>
              <p className="mt-2 hidden text-sm text-muted sm:block">
                {pick(lang, s.descriptionEn, s.descriptionAr)}
              </p>
            </div>
            <Link
              href={`/${lang}/seasonal/${s.slug}`}
              className="col-span-2 justify-self-start rounded-brand bg-green px-4 py-2 text-sm font-semibold text-ivory hover:bg-green-700 sm:col-span-1 sm:justify-self-end sm:px-5 sm:py-3"
            >
              {t.home.seasonalCta}
            </Link>
          </Container>
        </section>
      ))}

      <Container className="mt-8 space-y-20 sm:mt-16">
        <section aria-labelledby="categories">
          <SectionHeading id="categories" title={t.home.categoriesTitle} label={t.home.categoriesLabel} />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {/* While an offer like Eid Al-Adha is switched on it also sits first among the categories. */}
            {activeSeasons.map((s) => (
              <CategoryCard
                key={s.id}
                locale={lang}
                href={`/${lang}/seasonal/${s.slug}`}
                badge={t.home.seasonalLabel}
                testId="season-tile"
                category={{ ...s, status: "active" }}
                comingSoonLabel={t.catalog.comingSoon}
              />
            ))}
            {categories.map((c) => (
              <CategoryCard key={c.id} locale={lang} category={c} comingSoonLabel={t.catalog.comingSoon} />
            ))}
          </div>
        </section>

        {breeds.length > 0 && (
          <section aria-labelledby="breeds">
            <SectionHeading id="breeds" title={t.home.breedsTitle} label={t.home.breedsLabel} />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {breeds.map((b) => (
                <BreedCard
                  key={b.id}
                  locale={lang}
                  t={t.catalog}
                  href={`/${lang}/${b.category.slug}/${b.slug}`}
                  breed={b}
                  categoryName={nameOf(b.categoryId)}
                />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="how">
          <SectionHeading id="how" title={t.home.howTitle} label={t.home.howLabel} />
          <ol className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {t.home.steps.map((step, i) => (
              <li
                key={step.title}
                className={`p-4 sm:p-6 ${i % 2 ? "bg-green text-ivory" : "border border-line bg-white"}`}
              >
                <div className="h-0.5 w-12 bg-gold" aria-hidden />
                <p className={`mt-4 font-serif text-3xl ${i % 2 ? "text-gold" : "text-gold-deep"}`}>
                  {i + 1}
                </p>
                <h3 className="font-display mt-2 text-xl">{step.title}</h3>
                <p className={`mt-2 text-sm ${i % 2 ? "text-ivory/80" : "text-muted"}`}>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="trust">
          <SectionHeading id="trust" title={t.home.trustTitle} label={t.home.trustLabel} />
          <ul className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
            {t.home.trust.map((item) => (
              <li key={item.title} className="bg-ivory p-4 sm:p-6">
                <h3 className="font-display text-lg text-green">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq">
          <SectionHeading id="faq" title={t.home.faqTitle} label={t.home.faqLabel} />
          <div className="divide-y divide-line border-y border-line">
            {t.home.faq.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-green [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="text-gold-deep transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
