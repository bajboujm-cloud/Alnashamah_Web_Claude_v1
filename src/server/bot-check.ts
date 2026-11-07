import "server-only";
import { env } from "@/server/env";

/**
 * Bot check before sending a login code (Cloudflare Turnstile). With no secret key set (laptop) the
 * check is skipped. Cloudflare's free "always passes" test keys work locally too — see .env.example.
 */
export async function isHuman(token: string | undefined, ip: string | null) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
