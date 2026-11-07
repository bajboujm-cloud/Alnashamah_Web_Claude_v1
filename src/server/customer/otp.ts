import "server-only";
import { and, count, desc, eq, gt, gte, isNull } from "drizzle-orm";
import { hmac, safeEqualHex } from "@/server/auth/crypto";
import { db, schema as s } from "@/server/db";
import { env } from "@/server/env";
import { otpProvider } from "@/server/otp";
import { rateLimit } from "@/server/rate-limit";

export const CODE_MINUTES = 5;
export const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 30;
const SENDS_PER_WINDOW = 3;
const WINDOW_MINUTES = 15;
const LOCK_MINUTES = 15;

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
const codeHash = (phone: string, code: string) => hmac(`${phone}:${code}`, env.AUTH_SECRET, "otp");

/** Locked when a code was failed 5 times in the last 15 minutes. */
async function isLocked(phone: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(s.otpChallenges)
    .where(
      and(
        eq(s.otpChallenges.phone, phone),
        gte(s.otpChallenges.attempts, MAX_ATTEMPTS),
        gt(s.otpChallenges.createdAt, minutesAgo(LOCK_MINUTES)),
      ),
    );
  return n > 0;
}

export type SendError = "tooSoon" | "tooMany" | "locked" | "sendFailed";

/** Sends a new code to a (normalised) number, within the per-number and per-IP limits. */
export async function sendLoginCode(phone: string, ip: string | null) {
  if (await isLocked(phone))
    return { ok: false as const, error: "locked" as SendError, retryAfterSec: LOCK_MINUTES * 60 };

  const recent = await db
    .select({ createdAt: s.otpChallenges.createdAt })
    .from(s.otpChallenges)
    .where(and(eq(s.otpChallenges.phone, phone), gt(s.otpChallenges.createdAt, minutesAgo(WINDOW_MINUTES))))
    .orderBy(desc(s.otpChallenges.createdAt));
  const last = recent[0]?.createdAt.getTime() ?? 0;
  const wait = Math.ceil((last + RESEND_SECONDS * 1000 - Date.now()) / 1000);
  if (wait > 0) return { ok: false as const, error: "tooSoon" as SendError, retryAfterSec: wait };
  if (recent.length >= SENDS_PER_WINDOW)
    return { ok: false as const, error: "tooMany" as SendError, retryAfterSec: WINDOW_MINUTES * 60 };
  if (ip) {
    const perIp = rateLimit(`otp-ip:${ip}`, env.OTP_IP_LIMIT_PER_HOUR, 3_600_000);
    if (!perIp.ok)
      return { ok: false as const, error: "tooMany" as SendError, retryAfterSec: perIp.retryAfterSec };
  }

  let code: string | null;
  try {
    ({ code } = await otpProvider.send(phone));
  } catch (e) {
    console.error("sending login code failed", e);
    return { ok: false as const, error: "sendFailed" as SendError, retryAfterSec: 0 };
  }
  // Any older code for this number stops working.
  await db
    .update(s.otpChallenges)
    .set({ consumedAt: new Date() })
    .where(and(eq(s.otpChallenges.phone, phone), isNull(s.otpChallenges.consumedAt)));
  await db.insert(s.otpChallenges).values({
    phone,
    codeHash: code ? codeHash(phone, code) : null,
    expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000),
    ip,
  });
  return { ok: true as const, code };
}

export type VerifyError = "wrong" | "expired" | "locked";

/** Checks a code. Five wrong tries lock the number for 15 minutes. */
export async function verifyLoginCode(phone: string, code: string) {
  if (await isLocked(phone)) return { ok: false as const, error: "locked" as VerifyError, attemptsLeft: 0 };
  const [challenge] = await db
    .select()
    .from(s.otpChallenges)
    .where(and(eq(s.otpChallenges.phone, phone), isNull(s.otpChallenges.consumedAt)))
    .orderBy(desc(s.otpChallenges.createdAt))
    .limit(1);
  if (!challenge || challenge.expiresAt < new Date())
    return { ok: false as const, error: "expired" as VerifyError, attemptsLeft: 0 };

  const clean = code.replace(/\D/g, "");
  let match = false;
  if (/^\d{6}$/.test(clean)) {
    match = challenge.codeHash
      ? safeEqualHex(challenge.codeHash, codeHash(phone, clean))
      : !!(await otpProvider.check?.(phone, clean).catch(() => false));
  }
  if (!match) {
    const attempts = challenge.attempts + 1;
    await db.update(s.otpChallenges).set({ attempts }).where(eq(s.otpChallenges.id, challenge.id));
    return attempts >= MAX_ATTEMPTS
      ? { ok: false as const, error: "locked" as VerifyError, attemptsLeft: 0 }
      : { ok: false as const, error: "wrong" as VerifyError, attemptsLeft: MAX_ATTEMPTS - attempts };
  }
  // One use only: mark consumed in the same statement that checks it is still unused.
  const used = await db
    .update(s.otpChallenges)
    .set({ consumedAt: new Date() })
    .where(and(eq(s.otpChallenges.id, challenge.id), isNull(s.otpChallenges.consumedAt)))
    .returning({ id: s.otpChallenges.id });
  if (!used.length) return { ok: false as const, error: "expired" as VerifyError, attemptsLeft: 0 };
  return { ok: true as const };
}
