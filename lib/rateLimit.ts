// In-memory fixed-window rate limiter. Keyed per "route:caller" — caller is the
// verified session id where we have one (poll/signal/leave, after the cookie
// check), else the client IP (pre-join `join`). Caps requests per window;
// callers over budget get a 429 + Retry-After.
//
// CAVEAT: state lives in module memory, which on Vercel is per-lambda-instance,
// not shared across instances — so this is best-effort (stops a single hot
// instance being trivially flooded), not a global guarantee. Production-grade
// would back it with a shared store (e.g. Upstash Redis); that's infra, out of
// scope here.
import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds until reset; 0 when ok
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  // First hit or the previous window expired → start a fresh window.
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    sweep(now);
    return { ok: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

// Standard 429 response — keeps the routes terse.
export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { error: "rate limited" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

// Best-effort client IP for unauthenticated keying (the `join` route). Vercel /
// most proxies set x-forwarded-for; take the first hop.
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Drop expired buckets so the Map can't grow without bound. Throttled to once a
// minute and only walks entries already past reset, so it stays cheap.
let lastSweep = 0;
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(k);
  }
}
