import "server-only";
import { headers } from "next/headers";

/** Visitor's IP address (first entry of x-forwarded-for behind a proxy such as Vercel). */
export async function clientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || h.get("x-real-ip") || "").slice(0, 64) || null;
}
