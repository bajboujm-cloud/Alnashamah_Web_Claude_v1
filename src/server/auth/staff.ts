import "server-only";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { can, type Permission } from "./permissions";
import { readSession, type StaffUser } from "./session";

export class NotAllowedError extends Error {
  constructor() {
    super("Not allowed");
  }
}

/** For admin pages: sends the visitor to the login page, or to the dashboard if their role lacks access. */
export async function requireStaff(lang: Locale, permission?: Permission): Promise<StaffUser> {
  const user = await readSession("active");
  if (!user) redirect(`/${lang}/admin/login`);
  if (permission && !can(user.role, permission)) redirect(`/${lang}/admin?denied=1`);
  return user;
}

/** For admin Server Actions: throws if not signed in or not allowed. */
export async function authorize(permission: Permission): Promise<StaffUser> {
  const user = await readSession("active");
  if (!user || !can(user.role, permission)) throw new NotAllowedError();
  return user;
}
