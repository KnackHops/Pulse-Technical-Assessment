# Pulse — Roadmap

Living plan. Each checked sub-phase = one commit. Detailed write-up of *what* and *why*
lives in [`NOTES.md`](./NOTES.md); this is the execution checklist.

Phases & weights: **1 Make it run (15%)** · **2 Make it good (30%)** · **3 Make it secure
(20%)** · **4 Make it better (30%)** · delivery & git practice (5%).

---

## Phase 1 — Make it run

Three confirmed end-to-end breakers + hardening + a verification pass.

- [x] **1.1a — Fix chat (data-channel type mismatch).** `lib/webrtc.ts` `sendChat()` sends
  `{ t: "msg" }` but the receiver checks `t === "chat"` → every message dropped.
- [x] **1.1b — Fix WebRTC ICE race (stuck on "connecting").** Found in testing. In
  `lib/webrtc.ts`, `handleSignal()` flushed ICE candidates *before* `setRemoteDescription`,
  and signals are dispatched un-awaited so an offer + its candidates (same poll batch) ran
  concurrently → queued candidates never re-flushed → ICE never completes. Serialize signals
  via a promise chain; flush candidates *after* the remote description is set.
- [ ] **1.1c — Fix presence reaping (poll heartbeat).** `app/api/poll/route.ts` heartbeats
  `updateMany({ where: {} })` → refreshes *all* rows, so stale dots never get reaped.
  Scope to the caller (`where: { id }`).
- [ ] **1.2 — Free `busy` on call end.** `app/api/signal/route.ts` has no `end` branch →
  peers stay `busy: true` forever after a call, can't reconnect. Add the `end` reset.
- [ ] **1.3a — Handle `join()` failure.** `app/page.tsx` goes live even if `join()` rejects
  → user is invisible with no error. Catch, show error, stay on the gate.
- [ ] **1.4 — Two-browser verification pass.** See each other → connect → chat both ways →
  video → end video → end → close tab → dot gone ≤15s. Log any new bug as a 1.x item.

## Phase 2 — Make it good (UI/UX) — *sketch, refined when reached*

- [ ] 2.1 Foundation — design tokens, motion lib decision, shared primitives
- [ ] 2.2 Entry gate redesign
- [ ] 2.3 Map & dots (glow, busy state, animated join/leave)
- [ ] 2.4 Connection flow (animated modal + toasts)
- [ ] 2.5 Chat panel polish
- [ ] 2.6 Video panel polish
- [ ] 2.7 Responsive + a11y pass

## Phase 3 — Make it secure — *sketch*

- [ ] 3.1 (P0) Identity binding — signed httpOnly cookie bound to session id; verify on
  poll/signal/leave (stops impersonation + mailbox/SDP leak)
- [ ] 3.2 (P0) Rate limiting on all routes
- [ ] 3.3 (P1) Input hardening — reject `fromId === toId`, validate payload shape, cap peers
- [ ] 3.4 (P2) Security headers / CORS / error hygiene

## Phase 4 — Make it better (new feature) — *sketch, direction TBD*

- [ ] 4.x Direction TBD. Leading: global anonymized **connection ripples** (alive) +
  lightweight **safety** affordance (block/disconnect). Finalize at phase start.

---

## Deliverables

- [ ] Public GitHub repo with incremental history
- [ ] Live Vercel deployment
- [ ] `NOTES.md` complete (per-phase write-up)
