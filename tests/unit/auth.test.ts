import { describe, expect, it } from "vitest";
import { decrypt, encrypt, sha256 } from "@/server/auth/crypto";
import { generatePassword, hashPassword, passwordProblem, verifyPassword } from "@/server/auth/password";
import { can, roles } from "@/server/auth/permissions";
import { currentTotp, newTotpSecret, verifyTotp } from "@/server/auth/totp";

describe("passwords", () => {
  it("hashes and verifies; rejects wrong passwords", async () => {
    const hash = await hashPassword("Nashamah2026");
    expect(hash).not.toContain("Nashamah2026");
    expect(await verifyPassword("Nashamah2026", hash)).toBe(true);
    expect(await verifyPassword("nashamah2026", hash)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
  it("enforces the staff password rule", () => {
    expect(passwordProblem("short1")).toBe("tooShort");
    expect(passwordProblem("onlyletterslong")).toBe("weak");
    expect(passwordProblem("Nashamah2026")).toBeNull();
    expect(passwordProblem(generatePassword())).toBeNull();
  });
});

describe("authenticator codes", () => {
  it("accepts the current code, rejects wrong and malformed ones", () => {
    const secret = newTotpSecret();
    const now = Date.now();
    expect(verifyTotp(secret, currentTotp(secret, now), now)).toBeTypeOf("number");
    expect(verifyTotp(secret, "000000", now) === null || currentTotp(secret, now) === "000000").toBe(true);
    expect(verifyTotp(secret, "12ab56", now)).toBeNull();
  });
  it("accepts a code from the previous 30 s window but not 2 minutes old", () => {
    const secret = newTotpSecret();
    const now = Date.now();
    expect(verifyTotp(secret, currentTotp(secret, now - 30_000), now)).not.toBeNull();
    expect(verifyTotp(secret, currentTotp(secret, now - 120_000), now)).toBeNull();
  });
});

describe("encryption", () => {
  it("round-trips and fails with another key", () => {
    const sealed = encrypt("JBSWY3DPEHPK3PXP", "a".repeat(40));
    expect(sealed).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decrypt(sealed, "a".repeat(40))).toBe("JBSWY3DPEHPK3PXP");
    expect(() => decrypt(sealed, "b".repeat(40))).toThrow();
  });
  it("hashes session tokens", () => {
    expect(sha256("abc")).toHaveLength(64);
  });
});

describe("roles", () => {
  it("owner can do everything", () => {
    expect(can("owner", "staff.manage")).toBe(true);
  });
  it("only the owner manages staff", () => {
    expect(roles.filter((r) => can(r, "staff.manage"))).toEqual(["owner"]);
  });
  it("order staff only switch stock; content editors can't change prices", () => {
    expect(can("order_staff", "stock.toggle")).toBe(true);
    expect(can("order_staff", "catalog.prices")).toBe(false);
    expect(can("content_editor", "catalog.content")).toBe(true);
    expect(can("content_editor", "catalog.prices")).toBe(false);
    expect(can("content_editor", "stock.toggle")).toBe(false);
  });
});
