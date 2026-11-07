import "server-only";

/**
 * Simple in-memory rate limiter (per server process). Fine on a laptop and a single server;
 * replaced by Upstash Redis at go-live so limits are shared between servers.
 */
const hits = new Map<string, number[]>();

/** Records a hit and says whether it is still within `limit` hits per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false as const, retryAfterSec: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  // keep the map small
  if (hits.size > 10_000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return { ok: true as const, retryAfterSec: 0 };
}
