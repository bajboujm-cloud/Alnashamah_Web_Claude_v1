import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedCard } from "@/components/BreedCard";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { ComingSoonBadge } from "@/components/StockBadge";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternates } from "@/lib/site";
import { getCategoryWithBreeds } from "@/server/catalog";

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
  const [t, category] = await Promise.all([getDictionary(lang), getCategoryWithBreeds(slug)]);
  if (!category) notFound();
  const name = pick(lang, category.nameEn, category.nameAr);

  if (category.status === "coming_soon") {
    return (
      <Container className="py-20 text-center">
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
    <Container className="py-12">
      <div className="flex items-center gap-6">
        {category.illustrationUrl ? (
          <Image
            src={category.illustrationUrl}
            alt=""
            width={240}
            height={160}
            className="hidden h-auto w-36 sm:block"
          />
        ) : null}
        <div className="flex-1">
          <SectionHeading as="h1" title={name} label={t.catalog.breedsIn} />
        </div>
      </div>
      <p className="-mt-4 mb-8 max-w-2xl text-muted">
        {pick(lang, category.descriptionEn, category.descriptionAr)}
      </p>
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
