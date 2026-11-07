import { describe, expect, it } from "vitest";
import { formatPhone, maskPhone, normalisePhone } from "@/lib/phone";

describe("normalisePhone", () => {
  it("accepts the usual ways of typing a UAE mobile", () => {
    for (const v of [
      "0501234567",
      "050 123 4567",
      "50-123-4567",
      "+971501234567",
      "00971501234567",
      "+971 0501234567",
    ])
      expect(normalisePhone(v)).toBe("+971501234567");
    expect(normalisePhone("٠٥٠١٢٣٤٥٦٧")).toBe("+971501234567"); // Arabic digits
  });

  it("uses the chosen GCC country for local numbers", () => {
    expect(normalisePhone("0551234567", "966")).toBe("+966551234567");
    expect(normalisePhone("51234567", "965")).toBe("+96551234567");
    expect(normalisePhone("+97433123456")).toBe("+97433123456");
  });

  it("rejects landlines, short numbers and countries outside the allow-list", () => {
    expect(normalisePhone("042345678")).toBeNull(); // Dubai landline
    expect(normalisePhone("05012345")).toBeNull();
    expect(normalisePhone("+447700900123")).toBeNull(); // UK
    expect(normalisePhone("+12025550123")).toBeNull();
    expect(normalisePhone("")).toBeNull();
    expect(normalisePhone("abc")).toBeNull();
  });
});

describe("formatPhone / maskPhone", () => {
  it("formats for display", () => {
    expect(formatPhone("+971501234567")).toBe("+971 50 123 4567");
    expect(formatPhone("+96551234567")).toBe("+965 5123 4567");
    expect(maskPhone("+971501234567")).toBe("+971 50 ••• 4567");
    expect(maskPhone("+96551234567")).toBe("+965 •••• 4567");
  });
});
