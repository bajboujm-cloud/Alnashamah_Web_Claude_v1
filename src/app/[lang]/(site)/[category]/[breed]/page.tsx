import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedPhoto } from "@/components/BreedPhoto";
import { Container } from "@/components/Container";
import { OrderBuilder } from "@/components/OrderBuilder";
import { ShareButton } from "@/components/ShareButton";
import { OutOfStockBadge } from "@/components/StockBadge";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isBreedInStock, isOptionAvailable } from "@/lib/availability";
import { formatAge, formatWeight } from "@/lib/format";
import { alternates, siteUrl } from "@/lib/site";
import { getOrderChoices } from "@/server/cart";
import { getBreed } from "@/server/catalog";

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

export default async function BreedPage({ params, searchParams }: PageProps<"/[lang]/[category]/[breed]">) {
  const { lang, category: categorySlug, breed: breedSlug } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, found] = await Promise.all([getDictionary(lang), getBreed(categorySlug, breedSlug)]);
  if (!found) notFound();
  const choices = await getOrderChoices(found.category.id);
  const { occasion } = await searchParams;
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

      {/* Photo kept the same size as a breed card on the category page (about 22rem wide). */}
      <div className="grid items-start gap-10 md:grid-cols-[22rem_1fr]">
        <div className="w-full max-w-60 border-s-4 border-gold md:max-w-none">
          <BreedPhoto
            src={breed.photoUrl}
            alt={name}
            placeholderLabel={t.catalog.photoSoon}
            sizes="(max-width: 768px) 240px, 352px"
            priority
          />
        </div>
        <div className="min-w-0">
          <p className="label-tracked">{categoryName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-green sm:text-4xl">{name}</h1>
            {!inStock && <OutOfStockBadge label={t.catalog.outOfStock} />}
            <span className="ms-auto">
              <ShareButton label={t.catalog.share} text={t.catalog.shareText.replace("{name}", name)} />
            </span>
          </div>
          <div className="mt-4 h-px bg-gold/70" aria-hidden />
          <p className="mt-4 text-muted">{pick(lang, breed.descriptionEn, breed.descriptionAr)}</p>

          <div className="mt-8">
            <OrderBuilder
              lang={lang}
              t={{ order: t.order, catalog: t.catalog }}
              inStock={inStock}
              defaultOccasion={occasion === "udhiyah" ? "udhiyah" : "none"}
              sizes={breed.options.map((o) => ({
                id: o.id,
                label: pick(lang, o.labelEn, o.labelAr) ?? "",
                age: formatAge(o.ageMinMonths, o.ageMaxMonths, lang) ?? t.catalog.tbc,
                weight: formatWeight(o.weightMinKg, o.weightMaxKg, lang) ?? t.catalog.tbc,
                priceFils: o.priceFils,
                compareAtFils: o.compareAtPriceFils,
                available: isOptionAvailable(breed, o),
              }))}
              cutting={choices.cutting.map((c) => ({
                id: c.id,
                name: pick(lang, c.nameEn, c.nameAr),
                photoUrl: c.photoUrl,
                priceFils: c.priceFils,
                available: c.isAvailable,
              }))}
              extras={choices.extras.map((e) => ({
                id: e.id,
                name: pick(lang, e.nameEn, e.nameAr),
                priceFils: e.priceFils,
                available: e.isAvailable,
                selectedByDefault: e.selectedByDefault,
              }))}
              packaging={choices.packaging.map((p) => ({
                id: p.id,
                name: pick(lang, p.nameEn, p.nameAr),
                photoUrl: p.photoUrl,
                priceFils: p.priceFils,
                available: p.isAvailable,
              }))}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
