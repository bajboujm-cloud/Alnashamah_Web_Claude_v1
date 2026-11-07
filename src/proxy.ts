import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, hasLocale } from "@/i18n/config";

/**
 * Arabic is the default for everyone (alnashamah.ae → /ar), whatever the browser language.
 * Only a visitor who picked English with the language button is sent back to English.
 */
function preferredLocale(request: NextRequest) {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  return saved && hasLocale(saved) ? saved : defaultLocale;
}

/** Sends visitors without a language in the URL to /ar/... (or /en/... if they chose English). */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";
  if (hasLocale(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next.js internals, API routes and any file with an extension (images, icons, robots.txt …)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
