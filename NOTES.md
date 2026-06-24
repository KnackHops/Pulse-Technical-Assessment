# Pulse — Notes

Per-phase write-up. See [`ROADMAP.md`](./ROADMAP.md) for the execution checklist.

---

## Phase 1 — Make it run

I first did a rundown checkup using claude of what was obviously broken. Then I hands on tested the app through the flow. If I encounter a bug I check if it's already in the checklist, if it is I fix it then I continue the flow. If not I add it first, fix, then continue again.

The only two that the agent missed is sub phase 1.5 and 1.6 it seems. regarding video controls being pushed off of the screen and busy problem in abrupt disconnect. Other than that everything seems to have been seen. I will come back to this as I play around even more. As I'm bound to see one or two more that I missed.

Also decided to deploy for video call testing.

Last Edit: Encountered cross-network connection failures as I was building up phase 3. Managed to fix it via TURN relay

---

## Phase 2 — Make it good

Aside from the various UI quick improvements for animation, theme, dark/light mode, modals, toasts and cursor pointer in buttons. 

The part I focused the most is the gate for entering the map. I focused on making sure to tell what the web app is really about with one look instead of just texts. A globe in the back that have fake pins, and the pulsating grid + panel. I also introduced introduction here which touches on phase 4 as well, I'll say my reason for that in phase 4.
---

## Phase 3 — Make it secure

Secured Cookie and security headers for requests pretty standard. Rate limiting + cap mailbox to avoid flooding. Input hardening for extra checking of id.
---

## Phase 4 — Make it better

Introduction. Personalizes each entry a little bit, instead of just random dots you click to. Limited to 60 characters to challenge users to be even more creative. Who doesn't want personality in their app? We want to make them feel unique. It also only stays per session, as to not completely step over the ethos of nothing stays and every session is new.

If I get more, some sort of avatar that gets randomed every entry I think would be fun. Where certain avatar can be considered rare, or one can only exist at a time. Group call, which kinda breaks the ethos of the app but I think it would be fun. random events that requires users to join and work towards a goal via a mini game that pops up randomly.
