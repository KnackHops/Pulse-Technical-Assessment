import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { STALE_MS } from "@/lib/presence";
import { rateLimit, tooManyRequests, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/online — public, unauthenticated online count for the entry gate.
// The gate shows "N online" before the user has joined (so no session cookie
// exists yet), so this can't go through the authed /api/poll. It exposes only a
// count — no ids, no mailbox, no heartbeat, no side effects — which is no more
// than the map already shows everyone once they're in.
export async function GET(request: NextRequest) {
  const rl = rateLimit(`online:${clientIp(request)}`, 30, 10_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  const staleCutoff = new Date(Date.now() - STALE_MS);
  const count = await prisma.presence.count({
    where: { lastSeen: { gte: staleCutoff } },
  });

  return Response.json({ count });
}
