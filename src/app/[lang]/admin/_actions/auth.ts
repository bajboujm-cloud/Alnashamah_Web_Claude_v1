"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/admin/form-state";
import { hasLocale, type Locale } from "@/i18n/config";
import { audit } from "@/server/audit";
import { decrypt } from "@/server/auth/crypto";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { endSession, readSession, startSession } from "@/server/auth/session";
import { verifyTotp } from "@/server/auth/totp";
import { db, schema as s } from "@/server/db";
import { env } from "@/server/env";

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
// Compared against when the email is unknown, so both cases take the same time.
const dummyHash = hashPassword("not-a-real-password-0");

const langOf = (data: FormData): Locale => {
  const l = String(data.get("lang") ?? "");
  return hasLocale(l) ? l : "ar";
};

async function registerFailure(user: { id: string; failedLogins: number }) {
  const fails = user.failedLogins + 1;
  const locked = fails >= MAX_FAILS;
  await db
    .update(s.staffUsers)
    .set({
      failedLogins: locked ? 0 : fails,
      lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60_000) : undefined,
    })
    .where(eq(s.staffUsers.id, user.id));
  return locked;
}

const isLocked = (u: { lockedUntil: Date | null }) => !!u.lockedUntil && u.lockedUntil > new Date();

export async function loginAction(_prev: FormState, data: FormData): Promise<FormState> {
  const lang = langOf(data);
  const email = String(data.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(data.get("password") ?? "");
  const [user] = email ? await db.select().from(s.staffUsers).where(eq(s.staffUsers.email, email)) : [];

  if (!user || !user.isActive) {
    await verifyPassword(password, await dummyHash);
    return { status: "error", msg: "invalid", at: Date.now() };
  }
  if (isLocked(user)) return { status: "error", msg: "locked", at: Date.now() };
  if (!(await verifyPassword(password, user.passwordHash))) {
    const locked = await registerFailure(user);
    if (locked) await audit({ email }, "locked", "staff", user.id);
    return { status: "error", msg: locked ? "locked" : "invalid", at: Date.now() };
  }

  await db.update(s.staffUsers).set({ failedLogins: 0 }).where(eq(s.staffUsers.id, user.id));
  await startSession(user.id, "pending");
  redirect(`/${lang}/admin/two-factor`);
}

export async function verifyCodeAction(_prev: FormState, data: FormData): Promise<FormState> {
  const lang = langOf(data);
  const user = await readSession("pending");
  if (!user) redirect(`/${lang}/admin/login?expired=1`);
  if (isLocked(user)) return { status: "error", msg: "locked", at: Date.now() };
  if (!user.totpSecretEnc) redirect(`/${lang}/admin/two-factor`);

  const secret = decrypt(user.totpSecretEnc, env.AUTH_SECRET);
  const step = verifyTotp(secret, String(data.get("code") ?? ""));
  if (step === null || (user.totpLastStep !== null && step <= user.totpLastStep)) {
    const locked = await registerFailure(user);
    if (locked) {
      await endSession();
      return { status: "error", msg: "locked", at: Date.now() };
    }
    return { status: "error", msg: "invalidCode", fields: ["code"], at: Date.now() };
  }

  const firstSetup = !user.totpEnabled;
  await db
    .update(s.staffUsers)
    .set({ totpEnabled: true, totpLastStep: step, failedLogins: 0, lastLoginAt: new Date() })
    .where(eq(s.staffUsers.id, user.id));
  await startSession(user.id, "active");
  await audit(user, firstSetup ? "2fa-setup" : "login", "staff", user.id);
  redirect(`/${lang}/admin`);
}

export async function logoutAction(data: FormData) {
  await endSession();
  redirect(`/${langOf(data)}/admin/login`);
}
