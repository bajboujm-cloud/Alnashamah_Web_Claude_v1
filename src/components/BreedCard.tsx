import Link from "next/link";
import { pick, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { discountPercent, fromOffer, isBreedInStock } from "@/lib/availability";
import { formatAed } from "@/lib/format";
import { BreedPhoto } from "./BreedPhoto";
import { OutOfStockBadge } from "./StockBadge";

type Props = {
  locale: Locale;
  t: Dictionary["catalog"];
  href: string;
  categoryName?: string;
  breed: {
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    photoUrl: string | null;
    isAvailable: boolean;
    options: { isAvailable: boolean; priceFils: number | null; compareAtPriceFils?: number | null }[];
  };
};

export function BreedCard({ locale, t, href, breed, categoryName }: Props) {
  const name = pick(locale, breed.nameEn, breed.nameAr);
  const inStock = isBreedInStock(breed);
  const offer = fromOffer(breed);

  return (
    <Link
      href={href}
      className="group flex flex-col border border-line bg-white transition-colors hover:border-gold"
      data-testid="breed-card"
      data-in-stock={inStock}
    >
      <div className="relative">
        <BreedPhoto
          src={breed.photoUrl}
          alt={name}
          placeholderLabel={t.photoSoon}
          className={inStock ? "" : "opacity-60 grayscale"}
        />
        {!inStock ? (
          <div className="absolute start-2 top-2 sm:start-3 sm:top-3">
            <OutOfStockBadge label={t.outOfStock} />
          </div>
        ) : offer?.compareAtFils ? (
          <span
            className="absolute start-2 top-2 rounded-brand bg-danger px-2 py-0.5 text-xs font-bold text-white sm:start-3 sm:top-3"
            data-testid="discount-badge"
          >
            {t.discount.replace("{n}", String(discountPercent(offer.priceFils, offer.compareAtFils)))}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t-2 border-gold/60 p-3 sm:gap-2 sm:p-4">
        {categoryName ? <p className="label-tracked">{categoryName}</p> : null}
        <h3 className="font-display text-lg text-green sm:text-xl">{name}</h3>
        <p className="hidden text-sm text-muted sm:line-clamp-2">
          {pick(locale, breed.descriptionEn, breed.descriptionAr)}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1 text-xs sm:pt-2 sm:text-sm">
          <span className="font-semibold text-green">
            {offer ? (
              <>
                {t.from} {formatAed(offer.priceFils, locale)}
                {offer.compareAtFils ? (
                  <s className="ms-1 font-normal text-muted" data-testid="card-old-price">
                    {formatAed(offer.compareAtFils, locale)}
                  </s>
                ) : null}
              </>
            ) : (
              t.priceSoon
            )}
          </span>
          <span
            className="hidden whitespace-nowrap text-gold-deep group-hover:underline sm:inline"
            aria-hidden
          >
            {t.viewBreed} {locale === "ar" ? "←" : "→"}
          </span>
        </div>
      </div>
    </Link>
  );
}
