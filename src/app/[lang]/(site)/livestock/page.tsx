import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryCard } from "@/components/CategoryCard";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isSeasonVisible } from "@/lib/availability";
import { alternates } from "@/lib/site";
import { getSeasonalCollections, getVisibleCategories } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/[lang]/livestock">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.home.categoriesTitle, alternates: alternates(lang, "/livestock") };
}

/** All categories on one page (the "Livestock" menu button opens this). */
export default async function LivestockPage({ params }: PageProps<"/[lang]/livestock">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, categories, seasons] = await Promise.all([
    getDictionary(lang),
    getVisibleCategories(),
    getSeasonalCollections(),
  ]);
  const activeSeasons = seasons.filter((s) => isSeasonVisible(s));
  return (
    <Container className="py-10">
      <SectionHeading as="h1" title={t.home.categoriesTitle} />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4" data-testid="livestock-page">
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
    </Container>
  );
}
