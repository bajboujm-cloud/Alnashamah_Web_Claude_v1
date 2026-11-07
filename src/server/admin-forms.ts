import "server-only";
import { saveImage } from "@/server/storage";

/** Small helpers to read admin form fields safely. "invalid" means the field was filled in wrongly. */

export const text = (data: FormData, name: string, max = 2000) =>
  String(data.get(name) ?? "")
    .trim()
    .slice(0, max);

export const flag = (data: FormData, name: string) => data.get(name) === "on" || data.get(name) === "true";

export function optInt(data: FormData, name: string, min = 0, max = 10_000): number | null | "invalid" {
  const raw = text(data, name);
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max ? n : "invalid";
}

export function optDecimal(data: FormData, name: string, max = 100_000): number | null | "invalid" {
  const raw = text(data, name).replace(",", ".");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 10) / 10 : "invalid";
}

/** "1,143.50" AED → 114350 fils. */
export function aedToFils(data: FormData, name: string): number | null | "invalid" {
  const raw = text(data, name).replace(/,/g, "");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? Math.round(n * 100) : "invalid";
}

/** Words that can't be used as a category web address because pages already use them. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "seasonal",
  "livestock",
  "files",
  "api",
  "cart",
  "checkout",
  "account",
  "orders",
  "terms",
  "privacy",
]);

export const isSlug = (v: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) && v.length <= 60;

export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);

/** Uploads an optional image field. Returns undefined when no file was chosen. */
export async function upload(data: FormData, name: string, folder: string, allowSvg = false) {
  const file = data.get(name);
  if (!(file instanceof File) || file.size === 0) return undefined;
  return saveImage(file, folder, allowSvg);
}

/** Collects field names whose value is "invalid". */
export function invalidFields(values: Record<string, unknown>) {
  return Object.entries(values)
    .filter(([, v]) => v === "invalid")
    .map(([k]) => k);
}
