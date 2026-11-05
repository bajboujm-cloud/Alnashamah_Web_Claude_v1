import { describe, expect, it } from "vitest";
import { cartTotals, clampQuantity, lineFils, unitFils } from "@/lib/pricing";

const line = { sizeFils: 114300, cuttingFils: 0, packagingFils: 2500, extrasFils: [0, 500], quantity: 2 };

describe("pricing", () => {
  it("adds size, cutting, packaging and extras per animal, times quantity", () => {
    expect(unitFils(line)).toBe(117300);
    expect(lineFils(line)).toBe(234600);
  });
  it("shows the VAT part of VAT-inclusive prices", () => {
    const t = cartTotals([{ ...line, quantity: 1, extrasFils: [] }], 5, true); // 1168.00
    expect(t.totalFils).toBe(116800);
    expect(t.vatFils).toBe(5562); // 1168 × 5/105 = 55.62
    expect(t.subtotalFils + t.vatFils).toBe(t.totalFils);
  });
  it("adds VAT on top when prices exclude it", () => {
    const t = cartTotals(
      [{ sizeFils: 100000, cuttingFils: 0, packagingFils: 0, extrasFils: [], quantity: 1 }],
      5,
      false,
    );
    expect(t).toEqual({ subtotalFils: 100000, vatFils: 5000, totalFils: 105000 });
  });
  it("keeps quantities between 1 and 10", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(3.7)).toBe(3);
    expect(clampQuantity(99)).toBe(10);
    expect(clampQuantity(Number.NaN)).toBe(1);
  });
});
