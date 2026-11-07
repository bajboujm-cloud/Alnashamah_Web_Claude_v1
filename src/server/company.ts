import "server-only";
import { inArray } from "drizzle-orm";
import type { Company } from "@/content/terms";
import { db, schema as s } from "@/server/db";

/** Company details from the admin "Settings" (empty strings until filled in). */
export async function getCompany(): Promise<Company> {
  const keys = [
    "company.legal_name_en",
    "company.legal_name_ar",
    "company.trade_license_no",
    "company.trn",
    "company.address_en",
    "company.address_ar",
    "company.phone",
    "company.email",
  ];
  const rows = await db.select().from(s.settings).where(inArray(s.settings.key, keys));
  const get = (k: string) => {
    const v = rows.find((r) => r.key === k)?.value;
    return typeof v === "string" ? v.trim() : "";
  };
  return {
    nameEn: get("company.legal_name_en"),
    nameAr: get("company.legal_name_ar"),
    licence: get("company.trade_license_no"),
    trn: get("company.trn"),
    addressEn: get("company.address_en"),
    addressAr: get("company.address_ar"),
    phone: get("company.phone"),
    email: get("company.email"),
  };
}
