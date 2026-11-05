import { Secret, TOTP } from "otpauth";

const PERIOD = 30;

export function newTotpSecret() {
  return new Secret({ size: 20 }).base32;
}

function totp(secretBase32: string, label = "") {
  return new TOTP({
    issuer: "Al Nashamah",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: PERIOD,
    secret: Secret.fromBase32(secretBase32),
  });
}

/** otpauth:// link encoded in the QR code that authenticator apps scan. */
export const totpUri = (secretBase32: string, email: string) => totp(secretBase32, email).toString();

/**
 * Checks a 6-digit code (±1 step for clock drift). Returns the matched time-step so the caller can
 * reject reuse of the same code, or null when invalid.
 */
export function verifyTotp(secretBase32: string, code: string, now = Date.now()): number | null {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const delta = totp(secretBase32).validate({ token: clean, window: 1, timestamp: now });
  if (delta === null) return null;
  return Math.floor(now / 1000 / PERIOD) + delta;
}

/** Current code — used by tests and the create-admin script, never shown in the UI. */
export const currentTotp = (secretBase32: string, now = Date.now()) =>
  totp(secretBase32).generate({ timestamp: now });
