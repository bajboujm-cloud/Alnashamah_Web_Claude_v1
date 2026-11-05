import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import { applyOverrides, flatten } from "@/i18n/overrides";

describe("website text overrides", () => {
  it("flattens nested texts and lists into keys", () => {
    const flat = flatten({ home: { heroTitle: "A", steps: [{ title: "B" }] } });
    expect(flat).toEqual({ "home.heroTitle": "A", "home.steps.0.title": "B" });
  });
  it("applies edits without touching the original", () => {
    const edited = applyOverrides(en, { "home.heroTitle": "New title", "home.steps.1.title": "Slice" });
    expect(edited.home.heroTitle).toBe("New title");
    expect(edited.home.steps[1].title).toBe("Slice");
    expect(en.home.heroTitle).not.toBe("New title");
  });
  it("ignores admin texts, unknown keys and empty values", () => {
    const edited = applyOverrides(en, {
      "admin.title": "Hacked",
      "home.nope": "x",
      "home.heroText": "   ",
      "home.steps": "not a text",
    });
    expect(edited.admin.title).toBe(en.admin.title);
    expect(edited.home.heroText).toBe(en.home.heroText);
    expect(Array.isArray(edited.home.steps)).toBe(true);
  });
});
