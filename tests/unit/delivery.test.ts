import { describe, expect, it } from "vitest";
import { addDays, dubaiToday, isBookable, slotOpen } from "@/lib/delivery";
import { orderTotals } from "@/lib/pricing";

const slot = { startTime: "09:00", cutoffHours: 12 };

describe("delivery dates", () => {
  it("uses Dubai time for 'today'", () => {
    expect(dubaiToday(new Date("2026-11-07T19:59:00Z"))).toBe("2026-11-07"); // 23:59 Dubai
    expect(dubaiToday(new Date("2026-11-07T20:00:00Z"))).toBe("2026-11-08"); // 00:00 Dubai
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("closes a slot at its cut-off", () => {
    // 9 am Dubai on the 8th = 05:00 UTC; 12 h cut-off = 17:00 UTC on the 7th
    expect(slotOpen("2026-11-08", slot, new Date("2026-11-07T16:59:00Z"))).toBe(true);
    expect(slotOpen("2026-11-08", slot, new Date("2026-11-07T17:00:00Z"))).toBe(false);
  });

  it("refuses past dates, blackout days, far-future dates and nonsense", () => {
    const now = new Date("2026-11-07T08:00:00Z");
    expect(isBookable("2026-11-09", slot, now, new Set())).toBe(true);
    expect(isBookable("2026-11-06", slot, now, new Set())).toBe(false);
    expect(isBookable("2026-11-09", slot, now, new Set(["2026-11-09"]))).toBe(false);
    expect(isBookable("2027-03-01", slot, now, new Set())).toBe(false);
    expect(isBookable("2026-13-40", slot, now, new Set())).toBe(false);
    expect(isBookable("tomorrow", slot, now, new Set())).toBe(false);
  });
});

describe("orderTotals", () => {
  const line = { sizeFils: 100_000, cuttingFils: 0, packagingFils: 1_000, extrasFils: [], quantity: 2 };
  it("adds the delivery fee and shows the VAT part (VAT-inclusive prices)", () => {
    const t = orderTotals([line], 5_000, 5, true);
    expect(t.itemsFils).toBe(202_000);
    expect(t.totalFils).toBe(207_000);
    expect(t.vatFils).toBe(9_857);
    expect(t.subtotalFils + t.vatFils).toBe(t.totalFils);
  });
  it("adds VAT on top when prices exclude VAT", () => {
    const t = orderTotals([line], 0, 5, false);
    expect(t.totalFils).toBe(212_100);
  });
});

import { googleMapsLink, inUae } from "@/lib/geo";

describe("map pins", () => {
  it("accepts pins inside the UAE only", () => {
    expect(inUae({ lat: 25.2048, lng: 55.2708 })).toBe(true); // Dubai
    expect(inUae({ lat: 24.4539, lng: 54.3773 })).toBe(true); // Abu Dhabi
    expect(inUae({ lat: 24.7136, lng: 46.6753 })).toBe(false); // Riyadh
    expect(inUae({ lat: 51.5, lng: -0.12 })).toBe(false);
    expect(inUae({ lat: Number.NaN, lng: 55 })).toBe(false);
    expect(inUae({ lat: "25", lng: "55" })).toBe(false);
  });
  it("links to Google Maps", () => {
    expect(googleMapsLink({ lat: 25.2048, lng: 55.2708 })).toBe(
      "https://www.google.com/maps/search/?api=1&query=25.204800,55.270800",
    );
  });
});
