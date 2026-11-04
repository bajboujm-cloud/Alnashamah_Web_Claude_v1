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
import { getFeaturedBreeds, getSeasonalCollections, getVisibleCategories } from "@/server/catalog";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, categories, breeds, seasons] = await Promise.all([
    getDictionary(lang),
    getVisibleCategories(),
    getFeaturedBreeds(8),
    getSeasonalCollections(),
  ]);
  const activeSeasons = seasons.filter((s) => isSeasonVisible(s));
  const nameOf = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? pick(lang, c.nameEn, c.nameAr) : undefined;
  };

  return (
    <>
      {/* Hero */}
      <section className="brand-pattern relative overflow-hidden bg-green text-ivory">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-gold" aria-hidden />
        <Container className="grid items-center gap-10 py-16 sm:py-20 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="label-tracked !text-gold">{t.home.heroEyebrow}</p>
            <h1 className="font-display mt-4 text-3xl leading-tight sm:text-5xl">{t.home.heroTitle}</h1>
            <div className="mt-6 h-px w-24 bg-gold" aria-hidden />
            <p className="mt-6 max-w-xl text-ivory/85">{t.home.heroText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${lang}#categories`}
                className="rounded-brand bg-gold px-6 py-3 font-semibold text-green-900 hover:bg-ivory"
              >
                {t.home.heroCta}
              </Link>
              <Link
                href={`/${lang}#how`}
                className="rounded-brand border border-ivory/40 px-6 py-3 text-ivory hover:border-gold"
              >
                {t.home.heroSecondary}
              </Link>
            </div>
          </div>
          <Image
            src="/brand/mark-reverse.png"
            alt=""
            width={442}
            height={229}
            priority
            className="mx-auto h-auto w-full max-w-sm"
          />
        </Container>
      </section>

      {/* Seasonal banner */}
      {activeSeasons.map((s) => (
        <section key={s.id} className="border-b border-gold/50 bg-white">
          <Container className="grid items-center gap-6 py-8 sm:grid-cols-[auto_1fr_auto]">
            {s.illustrationUrl ? (
              <Image src={s.illustrationUrl} alt="" width={240} height={160} className="h-auto w-40" />
            ) : null}
            <div>
              <p className="label-tracked">{t.home.seasonalLabel}</p>
              <h2 className="font-display mt-1 text-2xl text-green">{pick(lang, s.nameEn, s.nameAr)}</h2>
              <p className="mt-2 text-sm text-muted">{pick(lang, s.descriptionEn, s.descriptionAr)}</p>
            </div>
            <Link
              href={`/${lang}/seasonal/${s.slug}`}
              className="justify-self-start rounded-brand bg-green px-5 py-3 text-sm font-semibold text-ivory hover:bg-green-700 sm:justify-self-end"
            >
              {t.home.seasonalCta}
            </Link>
          </Container>
        </section>
      ))}

      <Container className="mt-16 space-y-20">
        <section aria-labelledby="categories">
          <SectionHeading id="categories" title={t.home.categoriesTitle} label={t.home.categoriesLabel} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <CategoryCard key={c.id} locale={lang} category={c} comingSoonLabel={t.catalog.comingSoon} />
            ))}
          </div>
        </section>

        {breeds.length > 0 && (
          <section aria-labelledby="breeds">
            <SectionHeading id="breeds" title={t.home.breedsTitle} label={t.home.breedsLabel} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.steps.map((step, i) => (
              <li
                key={step.title}
                className={`p-6 ${i % 2 ? "bg-green text-ivory" : "border border-line bg-white"}`}
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
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {t.home.trust.map((item) => (
              <li key={item.title} className="bg-ivory p-6">
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
