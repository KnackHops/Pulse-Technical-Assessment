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
- [x] **1.1c — Fix presence reaping (poll heartbeat).** `app/api/poll/route.ts` heartbeats
  `updateMany({ where: {} })` → refreshes *all* rows, so stale dots never get reaped.
  Scope to the caller (`where: { id }`).
- [x] **1.2 — Free `busy` on call end.** `app/api/signal/route.ts` has no `end` branch →
  peers stay `busy: true` forever after a call, can't reconnect. Add the `end` reset.
- [x] **1.3a — Handle `join()` failure.** `app/page.tsx` goes live even if `join()` rejects
  → user is invisible with no error. Root cause: `lib/api.ts` `join()` never checked
  `res.ok`, so an HTTP 500 resolved silently. Throw on non-2xx, go live only on success, and
  surface the error in `EntryGate` (stay on the gate).
- [x] **1.5 — Fix video-panel overflow.** Found in live testing. `app/components/VideoPanel.tsx`:
  once the remote stream loads, the `flex-1` video wrapper (default `min-height: auto`) grows to
  the video's intrinsic resolution and pushes the control bar + local PiP off-screen — the user
  can't end the call. Add `min-h-0 overflow-hidden` so it shrinks to the flex track. (Mic/cam/
  end-call controls are Phase 2.6.)
- [ ] **1.4 — Two-browser verification pass.** See each other → connect → chat both ways →
  video → end video → end → close tab → dot gone ≤15s. Log any new bug as a 1.x item.

## Phase 2 — Make it good (UI/UX)

Decisions: **motion lib = `motion` (framer-motion)** for enter/exit; **theme = light + dark**
with a persisted toggle. Setup (user): `npm install motion`.

- [ ] **2.1 Foundation**
  - [x] 2.1a Design tokens + theme — Tailwind v4 `@theme` in `globals.css`: accent/surface/
    border/text tokens for **both** light & dark; radius, shadow, glow. Components reference
    tokens, not raw `zinc-*`.
  - [x] 2.1b Typography — remove the `body { font-family: Arial }` override so Geist (already
    loaded in `layout.tsx`) actually applies; set a type scale.
  - [x] 2.1c Cursor fix — Tailwind v4 dropped the default `cursor: pointer` on `<button>`;
    add a global base rule in `globals.css` so all buttons feel clickable again.
  - [x] 2.1d Theme toggle — context/provider + persistence (**sessionStorage**, clears on tab
    close to honor the no-persistence ethos; no-flash on load), and swap Mapbox style
    (`dark-v11` ↔ a light style) in `WorldMap.tsx` on toggle.
  - [x] 2.1f Migrate components to tokens — replace hardcoded `zinc/emerald/red` in
    `EntryGate`, `ChatPanel`, `ConnectionPrompt`, `VideoPanel`, `WorldMap`, `page.tsx` pills
    with semantic tokens so the theme actually applies app-wide; move toggle to top-left so it
    doesn't collide with the connection pills. (Deep visual polish still in 2.2–2.6.)
  - [ ] 2.1e Motion + primitives — wire `motion`; extract shared `Button`, `Modal`, `Toast`,
    `Panel` so 2.2–2.6 reuse them.
- [ ] 2.2 Entry gate redesign
- [ ] 2.3 Map & dots (glow, busy state, animated join/leave; polished pin-declutter)
- [ ] 2.4 Connection flow (animated modal + toasts)
- [ ] 2.5 Chat panel polish
- [ ] 2.6 Video panel polish (control bar, mic/cam toggles, end-call, chat-during-video)
- [ ] 2.7 Responsive + a11y pass (reduced-motion, focus-visible)

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
