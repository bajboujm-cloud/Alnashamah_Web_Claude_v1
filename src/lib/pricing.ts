/** Pure price maths — used for the live total in the browser AND recomputed on the server. */

export type PricedLine = {
  /** Price of the chosen size (fils). */
  sizeFils: number;
  cuttingFils: number;
  packagingFils: number;
  extrasFils: number[];
  quantity: number;
};

export const MAX_QUANTITY = 10;
export const MAX_LINES = 20;

/** Price of one animal with its choices. */
export const unitFils = (l: Omit<PricedLine, "quantity">) =>
  l.sizeFils + l.cuttingFils + l.packagingFils + l.extrasFils.reduce((a, b) => a + b, 0);

export const lineFils = (l: PricedLine) => unitFils(l) * l.quantity;

export type CartTotals = { subtotalFils: number; vatFils: number; totalFils: number };

/**
 * Totals for the cart. With VAT-inclusive prices (the UAE norm) the total is the sum and the VAT
 * part is shown for information; otherwise VAT is added on top. Delivery is added at checkout.
 */
export function cartTotals(lines: PricedLine[], vatPercent: number, pricesIncludeVat: boolean): CartTotals {
  const sum = lines.reduce((acc, l) => acc + lineFils(l), 0);
  if (pricesIncludeVat) {
    const vat = Math.round((sum * vatPercent) / (100 + vatPercent));
    return { subtotalFils: sum - vat, vatFils: vat, totalFils: sum };
  }
  const vat = Math.round((sum * vatPercent) / 100);
  return { subtotalFils: sum, vatFils: vat, totalFils: sum + vat };
}

export const clampQuantity = (q: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.floor(q) || 1));
