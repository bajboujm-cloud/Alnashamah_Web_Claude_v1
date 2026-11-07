import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { OrderBuilder } from "@/components/OrderBuilder";
import { ShareButton } from "@/components/ShareButton";
import { Switcher } from "@/components/Switcher";
import { OutOfStockBadge } from "@/components/StockBadge";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isBreedInStock, isOptionAvailable } from "@/lib/availability";
import { formatAge, formatWeight } from "@/lib/format";
import { alternates, siteUrl } from "@/lib/site";
import { getOrderChoices } from "@/server/cart";
import { schema } from "@/server/db";
import { noExtrasOccasions } from "@/server/occasion-rules";
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
  // ?occasion=udhiyah (from the Eid page) pre-selects the occasion in the order form
  const occasionParam = schema.occasions.find((o) => o !== "none" && o === occasion);
  const noExtraRules = await noExtrasOccasions();
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

      <div className="mx-auto max-w-3xl">
        <Switcher
          label={t.catalog.switchBreed}
          items={category.breeds.map((b) => ({
            key: b.id,
            href: `/${lang}/${category.slug}/${b.slug}${occasionParam ? `?occasion=${occasionParam}` : ""}`,
            label: pick(lang, b.nameEn, b.nameAr),
            image: b.photoUrl,
            active: b.id === breed.id,
            dim: !isBreedInStock(b),
          }))}
        />
      </div>

      {/* Breed name, then straight into the order (the photo and description are on the category card). */}
      <div className="mx-auto max-w-3xl">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-green sm:text-4xl">{name}</h1>
            {!inStock && <OutOfStockBadge label={t.catalog.outOfStock} />}
            <span className="ms-auto">
              <ShareButton label={t.catalog.share} text={t.catalog.shareText.replace("{name}", name)} />
            </span>
          </div>

          <div className="mt-6">
            <OrderBuilder
              lang={lang}
              t={{ order: t.order, catalog: t.catalog }}
              inStock={inStock}
              ageRule={
                category.sacrificeMinAgeMonths
                  ? {
                      minMonths: category.sacrificeMinAgeMonths,
                      message: t.order.ageRule
                        .replace("{category}", categoryName)
                        .replace(
                          "{age}",
                          formatAge(category.sacrificeMinAgeMonths, category.sacrificeMinAgeMonths, lang) ??
                            "",
                        ),
                    }
                  : null
              }
              defaultOccasion={occasionParam ?? "none"}
              noExtras={Object.fromEntries(
                noExtraRules.map((r) => [r.occasion, pick(lang, r.noteEn, r.noteAr) || t.order.notAvailable]),
              )}
              sizes={breed.options.map((o) => ({
                id: o.id,
                label: pick(lang, o.labelEn, o.labelAr) ?? "",
                age: formatAge(o.ageMinMonths, o.ageMaxMonths, lang) ?? t.catalog.tbc,
                weight: formatWeight(o.weightMinKg, o.weightMaxKg, lang) ?? t.catalog.tbc,
                priceFils: o.priceFils,
                ageMin: o.ageMinMonths,
                compareAtFils: o.compareAtPriceFils,
                available: isOptionAvailable(breed, o),
              }))}
              cutting={choices.cutting.map((c) => ({
                unavailableNote: pick(lang, c.unavailableNoteEn, c.unavailableNoteAr),
                id: c.id,
                name: pick(lang, c.nameEn, c.nameAr),
                photoUrl: c.photoUrl,
                priceFils: c.priceFils,
                available: c.isAvailable,
              }))}
              extras={choices.extras.map((e) => ({
                unavailableNote: pick(lang, e.unavailableNoteEn, e.unavailableNoteAr),
                id: e.id,
                name: pick(lang, e.nameEn, e.nameAr),
                priceFils: e.priceFils,
                available: e.isAvailable,
                selectedByDefault: e.selectedByDefault,
              }))}
              packaging={choices.packaging.map((p) => ({
                unavailableNote: pick(lang, p.unavailableNoteEn, p.unavailableNoteAr),
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
