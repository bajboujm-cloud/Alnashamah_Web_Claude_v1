import { pick, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { isOptionAvailable } from "@/lib/availability";
import { formatAed, formatAge, formatWeight } from "@/lib/format";
import { OutOfStockBadge } from "./StockBadge";

type Option = {
  id: string;
  labelEn: string | null;
  labelAr: string | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  weightMinKg: number | null;
  weightMaxKg: number | null;
  priceFils: number | null;
  compareAtPriceFils: number | null;
  isAvailable: boolean;
};

/** Age + weight + price rows. Unavailable rows stay visible, greyed, with an "Out of stock" label. */
export function OptionsList({
  locale,
  t,
  breed,
}: {
  locale: Locale;
  t: Dictionary["catalog"];
  breed: { isAvailable: boolean; options: Option[] };
}) {
  return (
    <ul className="divide-y divide-line border border-line bg-white" data-testid="options-list">
      {breed.options.map((o) => {
        const available = isOptionAvailable(breed, o);
        const label = pick(locale, o.labelEn, o.labelAr);
        return (
          <li
            key={o.id}
            className={`grid grid-cols-2 gap-x-4 gap-y-1 p-4 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center ${available ? "" : "bg-ivory/60 text-muted"}`}
            data-testid="option-row"
            data-available={available}
          >
            <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
              <span className="font-semibold text-green">{label}</span>
              {!available && <OutOfStockBadge label={t.outOfStock} />}
            </div>
            <div className="text-sm">
              <span className="text-muted">{t.age}: </span>
              {formatAge(o.ageMinMonths, o.ageMaxMonths, locale) ?? t.tbc}
            </div>
            <div className="text-sm">
              <span className="text-muted">{t.weight}: </span>
              {formatWeight(o.weightMinKg, o.weightMaxKg, locale) ?? t.tbc}
            </div>
            <div className="col-span-2 text-start font-semibold text-green sm:col-span-1 sm:text-end">
              {o.priceFils != null ? (
                <>
                  {o.compareAtPriceFils != null && o.compareAtPriceFils > o.priceFils ? (
                    <s className="me-2 text-sm font-normal text-muted">
                      {formatAed(o.compareAtPriceFils, locale)}
                    </s>
                  ) : null}
                  {formatAed(o.priceFils, locale)}
                </>
              ) : (
                <span className="text-sm font-normal text-muted">{t.priceSoon}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
