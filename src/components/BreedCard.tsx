import Link from "next/link";
import { pick, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fromPriceFils, isBreedInStock } from "@/lib/availability";
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
    options: { isAvailable: boolean; priceFils: number | null }[];
  };
};

export function BreedCard({ locale, t, href, breed, categoryName }: Props) {
  const name = pick(locale, breed.nameEn, breed.nameAr);
  const inStock = isBreedInStock(breed);
  const price = fromPriceFils(breed);

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
        {!inStock && (
          <div className="absolute start-3 top-3">
            <OutOfStockBadge label={t.outOfStock} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 border-t-2 border-gold/60 p-4">
        {categoryName ? <p className="label-tracked">{categoryName}</p> : null}
        <h3 className="font-display text-xl text-green">{name}</h3>
        <p className="line-clamp-2 text-sm text-muted">
          {pick(locale, breed.descriptionEn, breed.descriptionAr)}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2 text-sm">
          <span className="whitespace-nowrap font-semibold text-green">
            {price != null ? `${t.from} ${formatAed(price, locale)}` : t.priceSoon}
          </span>
          <span className="whitespace-nowrap text-gold-deep group-hover:underline" aria-hidden>
            {t.viewBreed} {locale === "ar" ? "←" : "→"}
          </span>
        </div>
      </div>
    </Link>
  );
}
