import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedCard } from "@/components/BreedCard";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { ComingSoonBadge } from "@/components/StockBadge";
import { Switcher } from "@/components/Switcher";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternates } from "@/lib/site";
import { getCategoryWithBreeds, getVisibleCategories } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/[lang]/[category]">): Promise<Metadata> {
  const { lang, category: slug } = await params;
  if (!hasLocale(lang)) return {};
  const category = await getCategoryWithBreeds(slug);
  if (!category) return {};
  return {
    title: pick(lang, category.nameEn, category.nameAr),
    description: pick(lang, category.descriptionEn, category.descriptionAr),
    alternates: alternates(lang, `/${slug}`),
  };
}

export default async function CategoryPage({ params }: PageProps<"/[lang]/[category]">) {
  const { lang, category: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, category, allCategories] = await Promise.all([
    getDictionary(lang),
    getCategoryWithBreeds(slug),
    getVisibleCategories(),
  ]);
  if (!category) notFound();
  const name = pick(lang, category.nameEn, category.nameAr);
  const switcher = (
    <Switcher
      label={t.catalog.switchCategory}
      items={allCategories.map((c) => ({
        key: c.id,
        href: `/${lang}/${c.slug}`,
        label: pick(lang, c.nameEn, c.nameAr),
        image: c.illustrationUrl,
        active: c.id === category.id,
        dim: c.status === "coming_soon",
        note: c.status === "coming_soon" ? t.catalog.comingSoon : undefined,
      }))}
    />
  );

  if (category.status === "coming_soon") {
    return (
      <Container className="py-10 text-center">
        <div className="text-start">{switcher}</div>
        {category.illustrationUrl ? (
          <Image
            src={category.illustrationUrl}
            alt=""
            width={240}
            height={160}
            className="mx-auto h-auto w-64 opacity-60"
          />
        ) : null}
        <h1 className="font-display mt-6 text-3xl text-green">{name}</h1>
        <div className="mt-3">
          <ComingSoonBadge label={t.catalog.comingSoon} />
        </div>
        <p className="mt-4 text-muted">{t.catalog.comingSoonText}</p>
        <Link href={`/${lang}`} className="mt-8 inline-block text-gold-deep underline">
          {t.errors.goHome}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      {switcher}
      {/* Category image beside the name; the description sits under the name, never over the image. */}
      <div className="mb-8 flex items-start gap-6">
        {category.illustrationUrl ? (
          <div className="relative hidden aspect-[3/2] w-36 shrink-0 overflow-hidden sm:block">
            <Image
              src={category.illustrationUrl}
              alt=""
              fill
              sizes="144px"
              className={category.illustrationUrl.endsWith(".svg") ? "object-contain" : "object-cover"}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <SectionHeading as="h1" title={name} />
          <p className="-mt-4 max-w-2xl text-muted">
            {pick(lang, category.descriptionEn, category.descriptionAr)}
          </p>
        </div>
      </div>
      {category.breeds.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {category.breeds.map((b) => (
            <BreedCard
              key={b.id}
              locale={lang}
              t={t.catalog}
              href={`/${lang}/${category.slug}/${b.slug}`}
              breed={b}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted">{t.catalog.noBreeds}</p>
      )}
    </Container>
  );
}
