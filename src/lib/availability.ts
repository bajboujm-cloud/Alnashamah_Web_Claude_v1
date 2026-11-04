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
