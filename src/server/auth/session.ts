import "server-only";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { db, schema as s } from "@/server/db";
import { env } from "@/server/env";
import { randomToken, sha256 } from "./crypto";

const isProd = env.NODE_ENV === "production";
/** `__Host-` cookies are locked to this exact site over HTTPS; plain name on http://localhost. */
export const SESSION_COOKIE = isProd ? "__Host-nsh_staff" : "nsh_staff";

const PENDING_MINUTES = 10;
const ACTIVE_HOURS = 12;

type Stage = "pending" | "active";

async function setCookie(token: string, expires: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/** Starts a new session (always a fresh token — prevents session fixation). */
export async function startSession(userId: string, stage: Stage) {
  await endSession();
  const token = randomToken();
  const expiresAt = new Date(
    Date.now() + (stage === "pending" ? PENDING_MINUTES * 60_000 : ACTIVE_HOURS * 3_600_000),
  );
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  await db.insert(s.staffSessions).values({ id: sha256(token), userId, stage, expiresAt, userAgent });
  await setCookie(token, expiresAt);
  // Opportunistic clean-up of expired sessions.
  await db.delete(s.staffSessions).where(lt(s.staffSessions.expiresAt, new Date()));
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(s.staffSessions).where(eq(s.staffSessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

/** Ends every session of a user (password change, account disabled, "sign out everywhere"). */
export async function endAllSessions(userId: string) {
  await db.delete(s.staffSessions).where(eq(s.staffSessions.userId, userId));
}

/** Returns the signed-in staff user for the given stage, or null. */
export async function readSession(stage: Stage) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ session: s.staffSessions, user: s.staffUsers })
    .from(s.staffSessions)
    .innerJoin(s.staffUsers, eq(s.staffUsers.id, s.staffSessions.userId))
    .where(
      and(
        eq(s.staffSessions.id, sha256(token)),
        eq(s.staffSessions.stage, stage),
        gt(s.staffSessions.expiresAt, new Date()),
      ),
    );
  if (!row || !row.user.isActive) return null;
  return row.user;
}

export type StaffUser = NonNullable<Awaited<ReturnType<typeof readSession>>>;
