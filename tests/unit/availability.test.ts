import { describe, expect, it } from "vitest";
import {
  discountPercent,
  fromOffer,
  fromPriceFils,
  isBreedInStock,
  isOptionAvailable,
  isSeasonVisible,
} from "@/lib/availability";

const opt = (isAvailable: boolean, priceFils: number | null) => ({ isAvailable, priceFils });

describe("availability toggles", () => {
  it("breed off makes every option unavailable", () => {
    const breed = { isAvailable: false, options: [opt(true, 100)] };
    expect(isOptionAvailable(breed, breed.options[0])).toBe(false);
    expect(isBreedInStock(breed)).toBe(false);
  });
  it("breed is out of stock when all options are off", () => {
    expect(isBreedInStock({ isAvailable: true, options: [opt(false, 1), opt(false, 2)] })).toBe(false);
    expect(isBreedInStock({ isAvailable: true, options: [opt(false, 1), opt(true, 2)] })).toBe(true);
  });
  it("from-price ignores unavailable and unpriced options", () => {
    const breed = {
      isAvailable: true,
      options: [opt(false, 500), opt(true, null), opt(true, 900), opt(true, 700)],
    };
    expect(fromPriceFils(breed)).toBe(700);
    expect(fromPriceFils({ isAvailable: true, options: [opt(true, null)] })).toBeNull();
  });
});

describe("seasonal visibility", () => {
  const now = new Date("2027-05-10T00:00:00Z");
  it("respects the switch and the date window", () => {
    expect(isSeasonVisible({ isActive: false, startsAt: null, endsAt: null }, now)).toBe(false);
    expect(isSeasonVisible({ isActive: true, startsAt: null, endsAt: null }, now)).toBe(true);
    expect(isSeasonVisible({ isActive: true, startsAt: new Date("2027-05-11"), endsAt: null }, now)).toBe(
      false,
    );
    expect(isSeasonVisible({ isActive: true, startsAt: null, endsAt: new Date("2027-05-09") }, now)).toBe(
      false,
    );
  });
});

describe("discount on cards", () => {
  const o = (priceFils: number | null, compareAtPriceFils: number | null, isAvailable = true) => ({
    priceFils,
    compareAtPriceFils,
    isAvailable,
  });
  it("uses the cheapest orderable size and keeps its old price only when higher", () => {
    expect(fromOffer({ isAvailable: true, options: [o(120000, null), o(102900, 114300)] })).toEqual({
      priceFils: 102900,
      compareAtFils: 114300,
    });
    expect(fromOffer({ isAvailable: true, options: [o(100000, 90000)] })).toEqual({
      priceFils: 100000,
      compareAtFils: null,
    });
    expect(fromOffer({ isAvailable: true, options: [o(50000, 90000, false), o(null, null)] })).toBeNull();
  });
  it("rounds the percentage", () => {
    expect(discountPercent(102900, 114300)).toBe(10);
    expect(discountPercent(75000, 100000)).toBe(25);
  });
});
