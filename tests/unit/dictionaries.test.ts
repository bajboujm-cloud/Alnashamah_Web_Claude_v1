import { describe, expect, it } from "vitest";
import ar from "@/i18n/dictionaries/ar.json";
import en from "@/i18n/dictionaries/en.json";

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  return typeof value;
}

describe("translations", () => {
  it("Arabic and English have exactly the same keys", () => {
    expect(shape(ar)).toEqual(shape(en));
  });
});
