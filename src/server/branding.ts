import "server-only";
import { inArray } from "drizzle-orm";
import { db, schema as s } from "@/server/db";

/** Images the owner can replace in Admin → Branding; the built-in files are the defaults. */
export const BRANDING_DEFAULTS = {
  "brand.logo_url": "/brand/logo-horizontal.png",
  "brand.logo_reverse_url": "/brand/logo-horizontal-reverse.png",
  "brand.hero_image_url": "/brand/mark-reverse.png",
} as const;
export type BrandingKey = keyof typeof BRANDING_DEFAULTS;
export const BRANDING_KEYS = Object.keys(BRANDING_DEFAULTS) as BrandingKey[];

export type Branding = {
  logo: string;
  logoReverse: string;
  heroImage: string;
  /** Digits only, or null to hide WhatsApp buttons. */
  whatsapp: string | null;
};

/** Current logo, welcome-section picture and WhatsApp number (admin settings, then built-in defaults). */
export async function getBranding(): Promise<Branding> {
  let values: Record<string, unknown> = {};
  try {
    const rows = await db
      .select()
      .from(s.settings)
      .where(inArray(s.settings.key, [...BRANDING_KEYS, "company.whatsapp"]));
    values = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    // database not reachable (e.g. during a build): use the defaults
  }
  const url = (k: BrandingKey) =>
    typeof values[k] === "string" && values[k] ? (values[k] as string) : BRANDING_DEFAULTS[k];
  const fromSettings = String(values["company.whatsapp"] ?? "").replace(/\D/g, "");
  const fromEnv = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  return {
    logo: url("brand.logo_url"),
    logoReverse: url("brand.logo_reverse_url"),
    heroImage: url("brand.hero_image_url"),
    whatsapp: fromSettings || fromEnv || null,
  };
}
