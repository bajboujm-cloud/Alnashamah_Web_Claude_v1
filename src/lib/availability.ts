/** Pure catalogue rules — shared by pages, the future admin, checkout and the mobile API. */

export type OptionLike = { isAvailable: boolean; priceFils: number | null };
export type BreedLike<O extends OptionLike = OptionLike> = { isAvailable: boolean; options: O[] };

/** An option can be ordered only if both the breed and the option are switched on. */
export const isOptionAvailable = (breed: { isAvailable: boolean }, option: OptionLike) =>
  breed.isAvailable && option.isAvailable;

/** A breed is "out of stock" if it is switched off, or every one of its options is. */
export const isBreedInStock = (breed: BreedLike) =>
  breed.isAvailable && breed.options.some((o) => o.isAvailable);

/** Lowest price among orderable options that have a price set; null = "Price coming soon". */
export function fromPriceFils(breed: BreedLike): number | null {
  const prices = breed.options
    .filter((o) => isOptionAvailable(breed, o) && o.priceFils != null)
    .map((o) => o.priceFils as number);
  return prices.length ? Math.min(...prices) : null;
}

/**
 * The "from" offer shown on breed cards: the cheapest orderable size, with its old (crossed-out) price
 * when one is set and higher. Null when no orderable size has a price.
 */
export function fromOffer(
  breed: BreedLike<OptionLike & { compareAtPriceFils?: number | null }>,
): { priceFils: number; compareAtFils: number | null } | null {
  const offers = breed.options
    .filter((o) => isOptionAvailable(breed, o) && o.priceFils != null)
    .sort((a, b) => (a.priceFils as number) - (b.priceFils as number));
  const best = offers[0];
  if (!best) return null;
  const price = best.priceFils as number;
  const old = best.compareAtPriceFils ?? null;
  return { priceFils: price, compareAtFils: old != null && old > price ? old : null };
}

/** Whole-number discount percentage, e.g. 1,143 → 1,029 = 10. */
export const discountPercent = (priceFils: number, compareAtFils: number) =>
  Math.round(((compareAtFils - priceFils) / compareAtFils) * 100);

/** A seasonal collection is visible when switched on and today is inside its optional window. */
export function isSeasonVisible(
  c: { isActive: boolean; startsAt: Date | null; endsAt: Date | null },
  now = new Date(),
) {
  if (!c.isActive) return false;
  if (c.startsAt && now < c.startsAt) return false;
  if (c.endsAt && now > c.endsAt) return false;
  return true;
}
