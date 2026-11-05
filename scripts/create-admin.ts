/**
 * Creates the first owner account, or resets a staff member's password and authenticator.
 *
 *   pnpm admin:create --email you@alnashamah.ae --name "Your Name"
 *   pnpm admin:create --email you@alnashamah.ae --reset
 *
 * A random password is printed once. On first sign-in the person links an authenticator app
 * (Google Authenticator, Microsoft Authenticator …) by scanning a QR code.
 */
import { parseArgs } from "node:util";
import { eq } from "drizzle-orm";
import { generatePassword, hashPassword } from "../src/server/auth/password";
import { createDb } from "../src/server/db/client";
import * as s from "../src/server/db/schema";
import { DATABASE_URL } from "./load-env";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    role: { type: "string", default: "owner" },
    reset: { type: "boolean", default: false },
  },
});

const email = values.email?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: pnpm admin:create --email you@example.com --name "Your Name" [--reset]');
  process.exit(1);
}
const role = values.role as (typeof s.staffRole.enumValues)[number];
if (!s.staffRole.enumValues.includes(role)) {
  console.error(`--role must be one of: ${s.staffRole.enumValues.join(", ")}`);
  process.exit(1);
}

const { db, sql } = createDb(DATABASE_URL, { max: 1 });
const password = generatePassword();
const passwordHash = await hashPassword(password);

try {
  const [existing] = await db.select().from(s.staffUsers).where(eq(s.staffUsers.email, email));
  if (existing) {
    if (!values.reset) {
      console.error(`${email} already exists. Add --reset to give it a new password and authenticator.`);
      process.exit(1);
    }
    await db
      .update(s.staffUsers)
      .set({
        passwordHash,
        totpSecretEnc: null,
        totpEnabled: false,
        totpLastStep: null,
        failedLogins: 0,
        lockedUntil: null,
        isActive: true,
      })
      .where(eq(s.staffUsers.id, existing.id));
    await db.delete(s.staffSessions).where(eq(s.staffSessions.userId, existing.id));
    await db
      .insert(s.auditLog)
      .values({ actor: "command line", action: "reset", entity: "staff", entityId: existing.id });
    console.log(`\n✓ Reset ${email}`);
  } else {
    const [user] = await db
      .insert(s.staffUsers)
      .values({ email, name: values.name?.trim() || email, role, passwordHash })
      .returning();
    await db.insert(s.auditLog).values({
      actor: "command line",
      action: "create",
      entity: "staff",
      entityId: user.id,
      after: { email, role },
    });
    console.log(`\n✓ Created ${role} account ${email}`);
  }
  console.log(`  Temporary password: ${password}`);
  console.log(
    "  Sign in at http://localhost:3000/ar/admin — you'll scan a QR code with an authenticator app.",
  );
  console.log("  Then change the password under “My account”.\n");
} finally {
  await sql.end();
}
