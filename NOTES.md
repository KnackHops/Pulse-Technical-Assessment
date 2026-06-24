# Pulse — Notes

Per-phase write-up. See [`ROADMAP.md`](./ROADMAP.md) for the execution checklist.

---

## Phase 1 — Make it run

I first did a rundown checkup using claude of what was obviously broken. Then I hands on tested the app through the flow. If I encounter a bug I check if it's already in the checklist, if it is I fix it then I continue the flow. If not I add it first, fix, then continue again.

The only two that the agent missed is sub phase 1.5 and 1.6 it seems. regarding video controls being pushed off of the screen and busy problem in abrupt disconnect. Other than that everything seems to have been seen. I will come back to this as I play around even more. As I'm bound to see one or two more that I missed.

Also decided to deploy for video call testing.
---

## Phase 2 — Make it good

Aside from the various UI quick improvements for animation, theme, dark/light mode, modals, toasts and cursor pointer in buttons. 

The part I focused the most is the gate for entering the map. I focused on making sure to tell what the web app is really about with one look instead of just texts. A globe in the back that have fake pins, and the pulsating grid + panel. I also introduced introduction here which touches on phase 4 as well, I'll say my reason for that in phase 4.
---

## Phase 3 — Make it secure

Secured Cookie and security headers for requests pretty standard. Rate limiting + cap mailbox to avoid flooding. Input hardening for extra checking of id.
---

## Phase 4 — Make it better

*What I built, why, and what I'd do next with more time.*

_(todo)_
