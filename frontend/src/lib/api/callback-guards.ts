import type { NextRequest } from "next/server";
import { redis } from "@/lib/redis/client";
import { log } from "@/lib/utils/logger";

/**
 * Shared guards for incoming third-party payment-callback routes.
 *
 * QPay and LendMN both POST JSON to public webhook URLs. Without these
 * guards the routes were vulnerable to (a) malformed bodies that crashed
 * the JSON parse path, and (b) replay/flood from anything that knows the
 * URL. Signature verification is provider-specific and not added here —
 * each route can layer that on top once the secret-management story is
 * in place.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const DEFAULT_LIMIT = 30;
const DEFAULT_WINDOW_SECONDS = 60;

/**
 * Token-bucket-ish per-key rate limit using Upstash Redis INCR + EXPIRE.
 * Fails open if Redis is unreachable so a Redis incident doesn't break
 * payment confirmation.
 */
export async function rateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowSeconds: number = DEFAULT_WINDOW_SECONDS,
): Promise<RateLimitResult> {
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      // First hit in this window — set expiry.
      await redis.expire(key, windowSeconds);
    }
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: count > limit ? windowSeconds : 0,
    };
  } catch (err) {
    log.warn("rate_limit_redis_unavailable_fail_open", err);
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * Best-effort caller IP for rate-limit keying. Vercel sets x-forwarded-for
 * with the upstream IP first; falls back to the connection peer.
 */
export function callerIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/**
 * Verify the request claims a JSON Content-Type. Some bots probe webhooks
 * with empty bodies or text/plain — those should 400 immediately, not
 * crash inside `req.json()`.
 */
export function isJsonRequest(req: NextRequest): boolean {
  const ct = req.headers.get("content-type")?.toLowerCase() ?? "";
  // Allow the optional charset parameter, etc.
  return ct.startsWith("application/json");
}

/** Parse JSON body or return null on failure. Never throws. */
export async function safeJson<T = unknown>(
  req: NextRequest,
): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
