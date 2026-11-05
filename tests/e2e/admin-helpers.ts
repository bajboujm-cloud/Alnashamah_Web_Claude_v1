import type { Page } from "@playwright/test";
import { encrypt } from "../../src/server/auth/crypto";
import { hashPassword } from "../../src/server/auth/password";
import { currentTotp, newTotpSecret } from "../../src/server/auth/totp";
import { sql } from "./db";

// Must match the server: CI sets AUTH_SECRET, local dev uses the built-in development value.
const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-me-0123456789abcdef";
export const PASSWORD = "E2e-Password-2026";

type Role = "owner" | "manager" | "order_staff" | "content_editor";

/** Creates (or recreates) a staff account with a known password and, optionally, a linked authenticator. */
export async function createStaff(email: string, role: Role, withAuthenticator = true) {
  const secret = newTotpSecret();
  await sql`delete from staff_users where email = ${email}`;
  await sql`insert into staff_users (email, name, role, password_hash, totp_secret_enc, totp_enabled)
    values (${email}, ${"E2E " + role}, ${role}, ${await hashPassword(PASSWORD)},
            ${withAuthenticator ? encrypt(secret, AUTH_SECRET) : null}, ${withAuthenticator})`;
  return secret;
}

export async function signIn(page: Page, lang: "en" | "ar", email: string, secret: string) {
  await page.goto(`/${lang}/admin/login`);
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(`**/${lang}/admin/two-factor`);
  await page.fill("input[name=code]", currentTotp(secret));
  await page.click("button[type=submit]");
  await page.waitForURL(new RegExp(`/${lang}/admin$`));
}

export const cleanupStaff = () => sql`delete from staff_users where email like '%@e2e.test'`;
