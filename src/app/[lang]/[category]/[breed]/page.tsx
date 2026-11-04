import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedPhoto } from "@/components/BreedPhoto";
import { Container } from "@/components/Container";
import { OptionsList } from "@/components/OptionsList";
import { SectionHeading } from "@/components/SectionHeading";
import { OutOfStockBadge } from "@/components/StockBadge";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isBreedInStock, isOptionAvailable } from "@/lib/availability";
import { formatAed } from "@/lib/format";
import { alternates, siteUrl } from "@/lib/site";
import { getBreed, getPackagingOptions } from "@/server/catalog";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/[category]/[breed]">): Promise<Metadata> {
  const { lang, category, breed: slug } = await params;
  if (!hasLocale(lang)) return {};
  const found = await getBreed(category, slug);
  if (!found) return {};
  const { breed, category: cat } = found;
  return {
    title: `${pick(lang, breed.nameEn, breed.nameAr)} — ${pick(lang, cat.nameEn, cat.nameAr)}`,
    description: pick(lang, breed.descriptionEn, breed.descriptionAr),
    alternates: alternates(lang, `/${category}/${slug}`),
  };
}

export default async function BreedPage({ params }: PageProps<"/[lang]/[category]/[breed]">) {
  const { lang, category: categorySlug, breed: breedSlug } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, found, packaging] = await Promise.all([
    getDictionary(lang),
    getBreed(categorySlug, breedSlug),
    getPackagingOptions(),
  ]);
  if (!found) notFound();
  const { breed, category } = found;
  const name = pick(lang, breed.nameEn, breed.nameAr);
  const categoryName = pick(lang, category.nameEn, category.nameAr);
  const inStock = isBreedInStock(breed);

  const priced = breed.options.filter((o) => o.priceFils != null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${name} — ${categoryName}`,
    description: pick(lang, breed.descriptionEn, breed.descriptionAr),
    brand: { "@type": "Brand", name: t.meta.siteName },
    image: breed.photoUrl ? new URL(breed.photoUrl, siteUrl).toString() : undefined,
    offers: priced.length
      ? priced.map((o) => ({
          "@type": "Offer",
          priceCurrency: "AED",
          price: ((o.priceFils as number) / 100).toFixed(2),
          availability: isOptionAvailable(breed, o)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        }))
      : undefined,
  };

  return (
    <Container className="py-10">
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted">
        <Link href={`/${lang}`} className="hover:text-green">
          {t.nav.home}
        </Link>
        <span className="mx-2 text-gold">/</span>
        <Link href={`/${lang}/${category.slug}`} className="hover:text-green">
          {categoryName}
        </Link>
        <span className="mx-2 text-gold">/</span>
        <span aria-current="page" className="text-charcoal">
          {name}
        </span>
      </nav>

      <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div className="border-s-4 border-gold">
          <BreedPhoto src={breed.photoUrl} alt={name} placeholderLabel={t.catalog.photoSoon} priority />
        </div>
        <div>
          <p className="label-tracked">{categoryName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-green sm:text-4xl">{name}</h1>
            {!inStock && <OutOfStockBadge label={t.catalog.outOfStock} />}
          </div>
          <div className="mt-4 h-px bg-gold/70" aria-hidden />
          <p className="mt-4 text-muted">{pick(lang, breed.descriptionEn, breed.descriptionAr)}</p>

          <div className="mt-8">
            <SectionHeading title={t.catalog.optionsTitle} label={t.catalog.optionsLabel} />
            <OptionsList locale={lang} t={t.catalog} breed={breed} />
          </div>

          <div className="mt-8 border border-gold/60 bg-white p-5">
            <p className="font-semibold text-green">{t.catalog.orderingSoon}</p>
            <p className="mt-1 text-sm text-muted">{t.catalog.orderingSoonText}</p>
          </div>

          {packaging.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg text-green">{t.catalog.packagingTitle}</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                {packaging.map((p) => (
                  <li
                    key={p.id}
                    className={`border border-line bg-white p-4 ${p.isAvailable ? "" : "text-muted"}`}
                  >
                    <p className="font-semibold text-green">{pick(lang, p.nameEn, p.nameAr)}</p>
                    <p className="mt-1 text-sm">
                      {p.priceFils === 0 ? t.catalog.free : formatAed(p.priceFils, lang)}
                    </p>
                    {!p.isAvailable && (
                      <div className="mt-2">
                        <OutOfStockBadge label={t.catalog.outOfStock} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
