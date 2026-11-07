/**
 * Sharia age rule for sacrifices: an Udhiyah (Eid Al-Adha) or Aqiqah must reach a minimum age
 * (set per category in the admin — e.g. sheep 6 months, goats 12 months).
 * Shared by the order builder (red warning) and the server (refuses the line).
 */
export const AGE_RULE_OCCASIONS = ["udhiyah", "aqiqah"] as const;

export const ageRuleApplies = (occasion: string, minAgeMonths: number | null | undefined) =>
  minAgeMonths != null && minAgeMonths > 0 && (AGE_RULE_OCCASIONS as readonly string[]).includes(occasion);

/** True when this size is too young for the chosen occasion. Unknown age counts as too young. */
export function isTooYoung(
  occasion: string,
  minAgeMonths: number | null | undefined,
  optionAgeMinMonths: number | null | undefined,
) {
  return ageRuleApplies(occasion, minAgeMonths) && (optionAgeMinMonths ?? 0) < (minAgeMonths as number);
}
