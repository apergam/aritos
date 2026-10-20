# T14 — Make collected rings sound rewarding

Dependencies: T09 implementation, T11. Unavailable physical devices do not block exploration; record those checks as not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 16](../requirements.md#16-first-version-feedback-and-polish-backlog--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md) before assignment. The user subsequently selected this card for the October 20 polish iteration. Consult the task board for current integrated status and review evidence.

## Outcome and ownership

Replace the current disappearance sound in collect mode with a more satisfying short coin-like or sparkling cue. Own `src/audio/` and audio lifecycle tests; coordinate shared composition changes. T09 acoustic review is still open; implementation availability satisfies the dependency, not a claim of listening acceptance.

## Work and acceptance

- Provide at least two brief, locally synthesized or properly documented asset candidates: coin-like and sparkling. Audition them after an actual collection and record the user's preferred candidate before declaring the sound accepted.
- Trigger only on the existing real collection event, once per ring; floor contact or screen overlap must not play a success cue. Classic threading does not become collection.
- Handle fast successive collections without harsh clipping or an ever-growing queue. Keep pumps and victory audible and distinct.
- Preserve saved mute, explicit gesture activation, pause/background cleanup, stale-event/restart guards and no-audio fallback.
- Keep all required audio available after initial loading. Record provenance for any recording in `docs/assets.md`; no paid asset purchase.

## Verification and handoff

Test duplicate/stale events, rapid collections, mute from startup, pause and restart cleanup. Run code checks and browser audition at a comfortable level; record browser and candidate chosen. Synthetic tests alone do not close T09 or prove acoustic quality.

Coverage: BL-08; section 13 and section 16; RF-40, RF-44; CA-19–CA-20.
