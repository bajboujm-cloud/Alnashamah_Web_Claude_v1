"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/admin/form-state";
import { hasLocale } from "@/i18n/config";
import { audit } from "@/server/audit";
import { isUuid, text } from "@/server/admin-forms";
import { generatePassword, hashPassword, passwordProblem, verifyPassword } from "@/server/auth/password";
import { roles, type Role } from "@/server/auth/permissions";
import { endAllSessions, startSession } from "@/server/auth/session";
import { authorize, NotAllowedError } from "@/server/auth/staff";
import { db, schema as s } from "@/server/db";

const fail = (msg: FormState["msg"], fields?: string[]): FormState => ({
  status: "error",
  msg,
  fields,
  at: Date.now(),
});

async function guarded(fn: () => Promise<FormState>): Promise<FormState> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof NotAllowedError) return fail("notAllowed");
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error(e);
    return fail("error");
  }
}

/** True if removing `userId` from the active owners would leave none. */
async function wouldRemoveLastOwner(userId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(s.staffUsers)
    .where(and(eq(s.staffUsers.role, "owner"), eq(s.staffUsers.isActive, true), ne(s.staffUsers.id, userId)));
  return n === 0;
}

export async function createStaff(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("staff.manage");
    const email = text(data, "email", 200).toLowerCase();
    const name = text(data, "name", 100);
    const role = text(data, "role") as Role;
    const bad = [
      ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? ["email"] : []),
      ...(!name ? ["name"] : []),
      ...(!roles.includes(role) ? ["role"] : []),
    ];
    if (bad.length) return fail("invalid", bad);
    const exists = await db.query.staffUsers.findFirst({ where: eq(s.staffUsers.email, email) });
    if (exists) return fail("emailTaken", ["email"]);
    const password = generatePassword();
    const [created] = await db
      .insert(s.staffUsers)
      .values({ email, name, role, passwordHash: await hashPassword(password) })
      .returning({ id: s.staffUsers.id });
    await audit(user, "create", "staff", created.id, null, { email, name, role });
    refresh();
    return { status: "ok", msg: "saved", extra: password, at: Date.now() };
  });
}

export async function updateStaff(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("staff.manage");
    const id = text(data, "id");
    const role = text(data, "role") as Role;
    const active = data.get("isActive") === "on";
    if (!isUuid(id) || !roles.includes(role)) return fail("invalid");
    const before = await db.query.staffUsers.findFirst({ where: eq(s.staffUsers.id, id) });
    if (!before) return fail("error");
    if (before.role === "owner" && (role !== "owner" || !active) && (await wouldRemoveLastOwner(id)))
      return fail("lastOwner");
    await db.update(s.staffUsers).set({ role, isActive: active }).where(eq(s.staffUsers.id, id));
    if (!active || role !== before.role) await endAllSessions(id);
    await audit(
      user,
      "update",
      "staff",
      id,
      { role: before.role, isActive: before.isActive },
      { role, isActive: active },
    );
    refresh();
    return { status: "ok", msg: "saved", at: Date.now() };
  });
}

export async function resetStaff(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("staff.manage");
    const id = text(data, "id");
    if (!isUuid(id) || id === user.id) return fail("invalid");
    const password = generatePassword();
    await db
      .update(s.staffUsers)
      .set({
        passwordHash: await hashPassword(password),
        totpSecretEnc: null,
        totpEnabled: false,
        totpLastStep: null,
        failedLogins: 0,
        lockedUntil: null,
      })
      .where(eq(s.staffUsers.id, id));
    await endAllSessions(id);
    await audit(user, "reset", "staff", id);
    refresh();
    return { status: "ok", msg: "saved", extra: password, at: Date.now() };
  });
}

export async function changePassword(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("dashboard.view");
    const current = String(data.get("current") ?? "");
    const next = String(data.get("new") ?? "");
    if (!(await verifyPassword(current, user.passwordHash))) return fail("wrongPassword", ["current"]);
    const problem = passwordProblem(next);
    if (problem) return fail(problem === "tooShort" ? "passwordTooShort" : "passwordWeak", ["new"]);
    await db
      .update(s.staffUsers)
      .set({ passwordHash: await hashPassword(next) })
      .where(eq(s.staffUsers.id, user.id));
    await endAllSessions(user.id);
    await startSession(user.id, "active");
    await audit(user, "password-change", "staff", user.id);
    return { status: "ok", msg: "passwordChanged", at: Date.now() };
  });
}

export async function signOutEverywhere(data: FormData) {
  const user = await authorize("dashboard.view");
  await endAllSessions(user.id);
  await audit(user, "sign-out-all", "staff", user.id);
  const lang = text(data, "lang");
  redirect(`/${hasLocale(lang) ? lang : "ar"}/admin/login`);
}
