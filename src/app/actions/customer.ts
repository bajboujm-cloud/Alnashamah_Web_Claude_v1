"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { isEmail } from "@/lib/email";
import { normalisePhone } from "@/lib/phone";
import { isHuman } from "@/server/bot-check";
import { readCartId } from "@/server/cart";
import { clientIp } from "@/server/client-ip";
import { sendLoginCode, verifyLoginCode, type SendError, type VerifyError } from "@/server/customer/otp";
import {
  endAllCustomerSessions,
  endCustomerSession,
  readCustomer,
  startCustomerSession,
} from "@/server/customer/session";
import { db, schema as s } from "@/server/db";
import { showCodeOnScreen } from "@/server/otp";

type PhoneInput = { phone: string; country: string };

export type SendCodeResult =
  | { ok: true; phone: string; devCode: string | null }
  | { ok: false; error: SendError | "invalidPhone" | "botCheck" | "error"; retryAfterSec?: number };

/** Step 1: send a one-time code to the customer's mobile. */
export async function sendCode(input: PhoneInput & { botToken?: string }): Promise<SendCodeResult> {
  try {
    const phone = normalisePhone(String(input?.phone ?? ""), String(input?.country ?? ""));
    if (!phone) return { ok: false, error: "invalidPhone" };
    const ip = await clientIp();
    if (!(await isHuman(input?.botToken, ip))) return { ok: false, error: "botCheck" };
    const r = await sendLoginCode(phone, ip);
    if (!r.ok) return { ok: false, error: r.error, retryAfterSec: r.retryAfterSec };
    return { ok: true, phone, devCode: showCodeOnScreen ? r.code : null };
  } catch (e) {
    console.error("sendCode failed", e);
    return { ok: false, error: "error" };
  }
}

export type ConfirmResult =
  { ok: true } | { ok: false; error: VerifyError | "invalidPhone" | "error"; attemptsLeft?: number };

/** Step 2: check the code, then sign in as a member or as a verified guest. */
export async function confirmCode(
  input: PhoneInput & { code: string; mode: "member" | "guest" },
): Promise<ConfirmResult> {
  try {
    const phone = normalisePhone(String(input?.phone ?? ""), String(input?.country ?? ""));
    if (!phone) return { ok: false, error: "invalidPhone" };
    const mode = input?.mode === "member" ? "member" : "guest";
    const r = await verifyLoginCode(phone, String(input?.code ?? ""));
    if (!r.ok) return { ok: false, error: r.error, attemptsLeft: r.attemptsLeft };

    const [customer] = await db
      .insert(s.customers)
      .values({ phone, isMember: mode === "member", lastLoginAt: new Date() })
      .onConflictDoUpdate({
        target: s.customers.phone,
        // never turn a member back into a guest
        set: { lastLoginAt: new Date(), isMember: sql`${s.customers.isMember} or ${mode === "member"}` },
      })
      .returning({ id: s.customers.id });
    await startCustomerSession(customer.id, mode);

    // The cart now belongs to this customer.
    const cartId = await readCartId();
    if (cartId)
      await db
        .update(s.carts)
        .set({ customerId: customer.id, addressId: null })
        .where(eq(s.carts.id, cartId));
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("confirmCode failed", e);
    return { ok: false, error: "error" };
  }
}

export async function signOut() {
  const cartId = await readCartId();
  if (cartId)
    await db.update(s.carts).set({ customerId: null, addressId: null }).where(eq(s.carts.id, cartId));
  await endCustomerSession();
  refresh();
}

/** Signs out on this device ("everywhere" = every device) and goes to the home page. */
export async function signOutTo(lang: string, everywhere: boolean) {
  const me = await readCustomer();
  if (me && everywhere) await endAllCustomerSessions(me.id);
  await signOut();
  redirect(`/${hasLocale(lang) ? lang : "ar"}`);
}

export type ProfileResult = { ok: boolean; fields?: string[] };

const cleanText = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Name, email and "email me the invoice" (members on the account page). */
export async function saveProfile(input: { name: string; email: string; emailInvoices: boolean }) {
  const me = await readCustomer();
  if (!me || me.kind !== "member") return { ok: false } satisfies ProfileResult;
  const name = cleanText(input?.name, 80);
  const email = cleanText(input?.email, 254).toLowerCase();
  const fields = [...(name.length < 2 ? ["name"] : []), ...(email && !isEmail(email) ? ["email"] : [])];
  if (fields.length) return { ok: false, fields } satisfies ProfileResult;
  await db
    .update(s.customers)
    .set({ name, email: email || null, emailInvoices: !!input?.emailInvoices && !!email })
    .where(eq(s.customers.id, me.id));
  refresh();
  return { ok: true } satisfies ProfileResult;
}

/** Removes an address from the member's address book (kept on past orders as a snapshot later). */
export async function deleteAddress(id: string) {
  const me = await readCustomer();
  if (!me || me.kind !== "member" || !/^[0-9a-f-]{36}$/.test(String(id))) return;
  await db
    .update(s.customerAddresses)
    .set({ isSaved: false })
    .where(and(eq(s.customerAddresses.id, id), eq(s.customerAddresses.customerId, me.id)));
  refresh();
}
