import "server-only";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { randomToken, sha256 } from "@/server/auth/crypto";
import { db, schema as s } from "@/server/db";
import { env } from "@/server/env";

const isProd = env.NODE_ENV === "production";
export const CUSTOMER_COOKIE = isProd ? "__Host-nsh_customer" : "nsh_customer";

export type SessionKind = "member" | "guest";
const LIFETIME_MS: Record<SessionKind, number> = {
  member: 30 * 86_400_000, // stay signed in for 30 days
  guest: 4 * 3_600_000, // enough to finish one checkout
};

/** Signs the customer in with a brand-new token (session rotation — prevents session fixation). */
export async function startCustomerSession(customerId: string, kind: SessionKind) {
  await endCustomerSession();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + LIFETIME_MS[kind]);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  await db.insert(s.customerSessions).values({ id: sha256(token), customerId, kind, expiresAt, userAgent });
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  await db.delete(s.customerSessions).where(lt(s.customerSessions.expiresAt, new Date()));
}

export async function endCustomerSession() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) await db.delete(s.customerSessions).where(eq(s.customerSessions.id, sha256(token)));
  jar.delete(CUSTOMER_COOKIE);
}

/** "Log out of all devices". */
export async function endAllCustomerSessions(customerId: string) {
  await db.delete(s.customerSessions).where(eq(s.customerSessions.customerId, customerId));
  (await cookies()).delete(CUSTOMER_COOKIE);
}

/** The signed-in (or verified guest) customer, or null. */
export async function readCustomer() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ customer: s.customers, kind: s.customerSessions.kind })
    .from(s.customerSessions)
    .innerJoin(s.customers, eq(s.customers.id, s.customerSessions.customerId))
    .where(and(eq(s.customerSessions.id, sha256(token)), gt(s.customerSessions.expiresAt, new Date())));
  return row ? { ...row.customer, kind: row.kind } : null;
}

export type SignedInCustomer = NonNullable<Awaited<ReturnType<typeof readCustomer>>>;
