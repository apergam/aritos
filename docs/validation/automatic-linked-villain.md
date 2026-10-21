# Automatic late-round linked villain — October 21, 2026

The user requested a random villain appearance with between five and one rings left, and asked for its dropped ring to be chained. The integration uses **one pair of two real linked rings**, rather than attaching a new body to an arbitrary existing ring. Each member remains an ordinary dynamic ring and counts toward the objective.

## Rules and implementation

- Normal play selects a random remaining-count threshold from **1 through 5**, then a random **1–3 active-second** wait after the round reaches or crosses that threshold. Paused/hidden time never advances it; there is no render-frame probability roll. If collection skips a count, crossing the threshold still works.
- Collect mode counts active rings. Classic counts rings not currently threaded, because threaded rings remain in the tank. A completed round and zero remaining never summon the villain. Leaving the eligible range cancels the current wait while retaining the round's chosen threshold.
- A successful appearance is limited to **once per round**, adding exactly two rings and raising the objective from twelve to fourteen. Existing saved progress is retained. A win is never reopened. Restart/new game clears the schedule, encounter, chain bodies and presentation state.
- The helper and villain serialize. An unsafe spawn is deferred for another active second without consuming the encounter or playing the cue. Both member poses must clear tank walls, fixtures, active bodies and their projected gravity fall corridors; spawn is atomic.
- Manual villain buttons are replaced by explanatory player copy. The historical laboratory's explicit +1/+2 controls remain available as independent, unlinked comparisons. Production always enables the automatic scheduler; the reusable mascot coordinator keeps scheduling opt-in for historical/manual callers.
- Jugar and pump gestures unlock the villain audio context. Automatic playback retains the global sound/music gates, local synthesized phrase, music ducking, and pause/mute/reset/disposal cancellation.

## Physical chain

`linkedPairPoses` creates closed rings in orthogonal planes, at a fixed **0.35-unit center separation**, rotated so both read from the front and fit the 1.8-unit depth. Their capsule material starts disjoint even though conservative bounding spheres overlap. This explicit linked spawn is the intended feature; no tunneling is needed to form it.

There is **no joint, collider filtering, glue, ongoing pose animation or scoring shortcut**. Contact response makes one ring pull its partner. Real threading/base contact removes only the collected member and leaves the other dynamic. The manual helper's preexisting scripted assistance remains separate from this natural chain movement.

The two linked members can also physically satisfy the classic rule: a capacity fixture settles twelve normal rings, adds the linked pair above the stack with initial collider clearance, and reaches fourteen threaded rings and the genuine stable victory without breaking the chain.

## Verification

The focused late-villain suite checks randomized thresholds and waits, count boundaries 0/1/5/6, count skipping, classic unthreaded counting, paused time, reset/resampling, helper serialization, silent safe retry, once-per-round audio/spawn limits, progress accounting, disjoint linked collision geometry, zero joints, unforced fall without gifted progress, real single-member collection, fourteen-ring classic completion and atomic rejection when only half a pair can clear, and twenty simulated seconds of fourteen-ring pumping/inversion in both models.

Final checks: **158/158 tests passed**, no failures/skips, about33 seconds; the focused late-villain suite passed11/11. TypeScript, build and `git diff --check` passed. Build **004a48ef**. Earlier manual-villain and ring-chain investigation reports remain historical; their no-automatic-timing statements are superseded by this explicit user request.

### Browser check

The final build was exercised in `/preview.html?scene=free&v=004a48ef`, the normal player composition with an isolated nonpersistent sticker sandbox. This was an ordinary twelve-ring free round, with **no injected score/physics state** and no manual villain controls. Repeated helper requests physically collected rings to reach the late-game window. The observed count progressed through7/12,8/12,9/12 and10/12 without an encounter; after the next help, the automatic encounter was observed as11/14 with the message “¡La traviesa soltó dos aros encadenados!”. One original ring and two visibly linked red rings remained. Thus this browser run demonstrates a later appearance rather than always entering at five; no exact sampled threshold is inferred from the post-step counter.

The game was paused to inspect the actual pair on the tank floor. The encounter status marked the round as used, helper controls disabled while paused, and the normal UI contained **zero manual villain buttons**. A360×800 viewport check had no horizontal overflow and contained the new explanatory panel; the viewport override was reset. No browser console errors were reported.

Evidence: [linked pair](evidence/automatic-linked-villain.png), [phone](evidence/automatic-linked-villain-phone.png), [DOM observations](evidence/automatic-linked-villain-browser.json).

Physical device/sensor/multitouch/FPS and subjective audio-mix/balance acceptance remain untested. The browser run used Space/two-button/collect; Node checks establish classic capacity and existing cross-model behavior, not subjective balance. No deployment or push was performed.
