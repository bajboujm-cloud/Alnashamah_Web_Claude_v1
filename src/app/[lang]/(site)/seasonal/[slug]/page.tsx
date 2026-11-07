import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreedCard } from "@/components/BreedCard";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isSeasonVisible } from "@/lib/availability";
import { alternates } from "@/lib/site";
import { getSeasonalCollection } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/[lang]/seasonal/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const found = await getSeasonalCollection(slug);
  if (!found) return {};
  return {
    title: pick(lang, found.collection.nameEn, found.collection.nameAr),
    description: pick(lang, found.collection.descriptionEn, found.collection.descriptionAr),
    alternates: alternates(lang, `/seasonal/${slug}`),
  };
}

export default async function SeasonalPage({ params }: PageProps<"/[lang]/seasonal/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, found] = await Promise.all([getDictionary(lang), getSeasonalCollection(slug)]);
  if (!found || !isSeasonVisible(found.collection)) notFound();
  const { collection, breeds } = found;
  // breeds come sorted by category, then breed order
  const groups: { category: (typeof breeds)[number]["category"]; items: typeof breeds }[] = [];
  for (const b of breeds) {
    const last = groups.at(-1);
    if (last && last.category.id === b.category.id) last.items.push(b);
    else groups.push({ category: b.category, items: [b] });
  }

  return (
    <>
      {/* Green banner like the home page welcome (same size, no photo). */}
      <section
        className="brand-pattern relative overflow-hidden bg-green text-ivory"
        data-testid="season-hero"
      >
        <div className="absolute inset-y-0 start-0 w-1.5 bg-gold" aria-hidden />
        <Container className="py-6 sm:py-20">
          <p className="label-tracked !text-gold">{t.home.seasonalLabel}</p>
          <h1 className="font-display mt-2 text-2xl leading-tight sm:mt-4 sm:text-5xl">
            {pick(lang, collection.nameEn, collection.nameAr)}
          </h1>
          <div className="mt-6 hidden h-px w-24 bg-gold sm:block" aria-hidden />
          <p className="mt-3 max-w-2xl text-sm text-ivory/85 sm:mt-6 sm:text-base">
            {pick(lang, collection.descriptionEn, collection.descriptionAr)}
          </p>
        </Container>
      </section>
      {/* Breeds straight away, grouped by category (Sheep, then Goats …). */}
      <Container className="space-y-10 py-8 sm:space-y-14 sm:py-12">
        {groups.map(({ category, items }) => (
          <section key={category.id} aria-labelledby={`group-${category.slug}`} data-testid="season-group">
            <SectionHeading
              id={`group-${category.slug}`}
              title={pick(lang, category.nameEn, category.nameAr)}
              label={t.catalog.eligibleBreeds}
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {items.map((b) => (
                <BreedCard
                  key={b.id}
                  locale={lang}
                  t={t.catalog}
                  href={`/${lang}/${b.category.slug}/${b.slug}${collection.occasion !== "none" ? `?occasion=${collection.occasion}` : ""}`}
                  breed={b}
                  categoryName={pick(lang, b.category.nameEn, b.category.nameAr)}
                />
              ))}
            </div>
          </section>
        ))}
      </Container>
    </>
  );
}
