import { describe, expect, it } from "vitest";
import { ageRuleApplies, isTooYoung } from "@/lib/sacrifice";

describe("sacrifice age rule", () => {
  it("applies only to Udhiyah and Aqiqah when the category has a minimum age", () => {
    expect(ageRuleApplies("udhiyah", 6)).toBe(true);
    expect(ageRuleApplies("aqiqah", 12)).toBe(true);
    expect(ageRuleApplies("none", 6)).toBe(false);
    expect(ageRuleApplies("sadaqah", 6)).toBe(false);
    expect(ageRuleApplies("udhiyah", null)).toBe(false);
    expect(ageRuleApplies("udhiyah", 0)).toBe(false);
  });

  it("uses the youngest age of the size", () => {
    expect(isTooYoung("udhiyah", 6, 4)).toBe(true); // 4–6 months sheep
    expect(isTooYoung("udhiyah", 6, 6)).toBe(false); // 6–8 months sheep
    expect(isTooYoung("aqiqah", 12, 6)).toBe(true); // 6–8 months goat
    expect(isTooYoung("aqiqah", 12, 12)).toBe(false);
    expect(isTooYoung("udhiyah", 6, null)).toBe(true); // age not set yet
    expect(isTooYoung("none", 6, 2)).toBe(false);
  });
});
