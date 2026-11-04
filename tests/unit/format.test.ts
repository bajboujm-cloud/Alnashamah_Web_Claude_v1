import { describe, expect, it } from "vitest";
import { formatAed, formatAge, formatRange, formatWeight } from "@/lib/format";

describe("formatAed", () => {
  it("formats whole dirhams in English and Arabic with Western digits", () => {
    expect(formatAed(125000, "en")).toBe("AED 1,250");
    expect(formatAed(125000, "ar")).toBe("1,250 د.إ");
  });
  it("keeps fils when present", () => {
    expect(formatAed(1050, "en")).toBe("AED 10.50");
  });
  it("formats zero", () => {
    expect(formatAed(0, "en")).toBe("AED 0");
  });
});

describe("ranges", () => {
  it("handles full, open and empty ranges", () => {
    expect(formatRange(10, 13, "en")).toBe("10–13");
    expect(formatRange(10, null, "en")).toBe("10+");
    expect(formatRange(null, 13, "en")).toBe("≤ 13");
    expect(formatRange(12, 12, "en")).toBe("12");
    expect(formatRange(null, null, "en")).toBeNull();
  });
  it("adds units", () => {
    expect(formatWeight(10, 13.5, "en")).toBe("10–13.5 kg");
    expect(formatWeight(10, 13, "ar")).toBe("10–13 كجم");
    expect(formatAge(12, 15, "en")).toBe("12–15 months");
    expect(formatAge(6, 9, "ar")).toBe("6–9 أشهر");
    expect(formatAge(12, 15, "ar")).toBe("12–15 شهراً");
    expect(formatAge(null, null, "ar")).toBeNull();
  });
});
