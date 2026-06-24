// Per-session identity binding. The client mints its own session id
// (crypto.randomUUID in page.tsx); on /api/join the server signs that id and
// returns it as an httpOnly cookie. Every other route recomputes the HMAC and
// checks the cookie's id matches the id being acted on — so a client can only
// act as an id the server actually signed for it. Not a login: the cookie holds
// no PII, is a session cookie (no expiry → dies with the tab), and exists only
// to stop one client impersonating another's mailbox/signals.
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "pulse_session";

// Read lazily (not at import) so build/lint don't require the env to be set;
// a request without the secret fails loudly with a clear 500 instead.
function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error(
      "SESSION_SECRET is not set — add a long random string to the environment.",
    );
  }
  return s;
}

function hmac(id: string): string {
  return createHmac("sha256", getSecret()).update(id).digest("base64url");
}

// Cookie value = `${id}.${hmac(id)}`. The HMAC can't be forged without the
// secret, so a valid cookie proves the server signed this id (on join).
export function signSession(id: string): string {
  return `${id}.${hmac(id)}`;
}

// Verified id from the request cookie, or null if absent/tampered.
export function readSession(req: NextRequest): string | null {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = raw.slice(0, dot);
  const got = Buffer.from(raw.slice(dot + 1));
  const want = Buffer.from(hmac(id));
  // Constant-time compare; timingSafeEqual throws on length mismatch, so guard.
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  return id;
}

// Shared cookie attributes. No maxAge/expires → a session cookie that dies with
// the tab, same lifetime as the sessionStorage theme/intro. secure only in prod
// so it still works on localhost http in dev (ngrok tunnels are https).
export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
