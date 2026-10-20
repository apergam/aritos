# T03 — Complete round lifecycle and rules

Dependencies: T01.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md) sections 4 and 13–14, the [guide](../implementation-guide.md), and `docs/module-contracts.md`. Follow shared verification/handoff rules.

## Outcome and current state

Both rule modes and their victory conditions already exist. Complete the round/session controller for menus, confirmation, backgrounding, restart, and event lifecycle without changing the accepted scoring rules.

## Ownership

Own `src/game/` and lifecycle/rule integration tests. Coordinate necessary physics adapter changes through the T01 contract; do not independently redesign colliders, forces, or rendering.

## Work and acceptance

- Use explicit round identity and independent pause reasons. Closing a menu cannot override manual pause or a hidden document; canceling restart preserves the round.
- Opening settings or restart confirmation pauses active physics time. Returning from the background cannot apply a backlog of steps.
- Classic: all twelve rings must be threaded for two uninterrupted active seconds; losing one resets the timer. Keep extraction possible.
- Collect: physical threading and continuous pedestal contact for 0.12 active seconds precede body removal; progress never decreases; the target stays at the initial ring count.
- Victory fires once per round. Restart clears progress/contact timers and creates a fresh round; stale callbacks/events cannot celebrate or mutate it.
- Expose start/model/mode transition commands for the UI. A model switch creates a new round; theme changes never do. Closing/reloading does not restore a round.

## Verification and handoff

Test overlapping pause reasons, cancel/confirm restart, background return, rule-mode isolation, collection without false progress, once-per-round victory, and stale-event cleanup. Compare equivalent active time at different render schedules (CA-07), not only a single engine-step loop. Keep existing physics tests, typecheck, and build passing. Provide UI/event integration examples.

Coverage: RF-10, RF-25–RF-26, RF-30–RF-31, RF-41–RF-42, RF-45; RT-06; CA-07, CA-13–CA-18; section 13.
