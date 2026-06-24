import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/leave — body { id }. Removes the presence row and any pending
// signals to/from this user. Called via navigator.sendBeacon on tab close, so
// the body may arrive as text — parse defensively.
export async function POST(request: NextRequest) {
  let id: string | undefined;
  try {
    const text = await request.text();
    id = text ? (JSON.parse(text)?.id as string | undefined) : undefined;
  } catch {
    id = undefined;
  }

  if (typeof id !== "string" || !id) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  // Only the owner can tear down their own row (sendBeacon sends the cookie
  // same-origin on tab close, so the unload path still works).
  if (readSession(request) !== id) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const rl = rateLimit(`leave:${id}`, 10, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  // If this user was in a call, free their partner (clear busy + pairing) —
  // otherwise the partner stays "busy" forever after we delete this row.
  const me = await prisma.presence.findUnique({
    where: { id },
    select: { peerId: true },
  });
  if (me?.peerId) {
    await prisma.presence.updateMany({
      where: { id: me.peerId },
      data: { busy: false, peerId: null },
    });
  }

  // Independent cleanup deletes — no atomicity needed (and interactive
  // transactions are unreliable over a PgBouncer pooler).
  await prisma.signal.deleteMany({
    where: { OR: [{ toId: id }, { fromId: id }] },
  });
  await prisma.presence.deleteMany({ where: { id } });

  return Response.json({ ok: true });
}
