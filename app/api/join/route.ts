import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyPrivacyOffset, isValidLatLng } from "@/lib/geo";
import { MAX_INTRO_LEN } from "@/lib/types";
import { SESSION_COOKIE, signSession, cookieOptions } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Trim, cap, and normalize the optional intro. Returns null for empty/invalid
// so we never store junk. Stored as plain text and only ever rendered as text.
function sanitizeIntro(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_INTRO_LEN);
}

// POST /api/join — body { id, lat, lng, intro? } (raw coords).
// Applies a 1–3 km privacy offset and upserts the presence row. Raw
// coordinates are never stored; the intro is optional + ephemeral.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const { id, lat, lng, intro } = (body ?? {}) as Record<string, unknown>;

  if (typeof id !== "string" || id.length < 8 || id.length > 64) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  if (!isValidLatLng(lat, lng)) {
    return Response.json({ error: "invalid coordinates" }, { status: 400 });
  }

  const offset = applyPrivacyOffset(lat as number, lng as number);
  const cleanIntro = sanitizeIntro(intro);

  await prisma.presence.upsert({
    where: { id },
    create: {
      id,
      lat: offset.lat,
      lng: offset.lng,
      busy: false,
      intro: cleanIntro,
      lastSeen: new Date(),
    },
    update: {
      lat: offset.lat,
      lng: offset.lng,
      intro: cleanIntro,
      lastSeen: new Date(),
    },
  });

  // Bind this id to the client: a signed, httpOnly session cookie. The other
  // routes verify it, so only the client that joined as `id` can act as `id`.
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession(id), cookieOptions);
  return res;
}
