# T23 enemy feasibility review — October 20, 2026

Read-only review after the selected T17/T19 implementation. No enemy behavior has been added to normal play or the lab. T23 remains planned.

## Existing implementation

- `src/physics/simulation.ts:55–65`: `addRing` already creates a real body with 20 capsule colliders, assigns a monotonically increasing per-round ID, and increments total. It does **not** validate free space, enforce a cap, reject completed rounds or deduplicate encounters. Calling it directly from UI would bypass required protections.
- `Simulation.reset` rebuilds the world and restores starting counts/IDs. `step` handles contacts, collection, completion and victory synchronously; a queued spawn must be processed before that tick's completion test. `stableTime` must reset on successful additions.
- `src/game/session.ts`: pauses block steps and victory emits after collection events; round identity protects subscribers. A session command/result is needed for encounter identity, failure feedback and objective synchronization. Collect must always satisfy active + collected = total.
- Both renderers retain meshes by stable ID, but colors currently cycle by ID. Enemy rings need explicit semantic metadata propagated to the renderer; guessing from an ID threshold would be fragile.
- `src/audio/theme-music.ts` owns one loop with pause/mute offsets, but exposes no duck/cue API. A short original cue needs lifecycle-safe duck/restore without restarting the theme phrase, respecting both sound/music switches.

## Recommended smallest experiment

Use manual lab-only “Add 1” and “Add 2” triggers, one encounter and at most two added rings per round (12→14). A villain appears with a visible warning and short original musical phrase. No automatic trigger when the last few rings remain. This is a proposed candidate, not a selected production rule.

Tag a request with round ID and encounter ID, consume it at the start of a fixed tick, and reject paused, stale, duplicate, disposed or already-won requests. For +2, prefer atomic creation: create both only if both safe poses are available; otherwise add neither and show why. Validate candidate horizontal poses in the upper tank against the complete wall, peg, base and active-ring shapes, including both candidates against each other. Conservative clearance can reject crowded candidates; never force overlap. Count only actual body creation and preserve collected progress.

Restart clears requests, added rings, visual/cue state and limits. No reopening a won round or repeating celebration. Disable triggers while paused/backgrounded and avoid an accumulated queue. Keep this experiment separate from pressure/powerup/width/count comparisons and from normal-player sticker rewards.

## Work before a playable POC

1. Safe-pose search, atomic spawn result and ID/cap guards behind simulation/session APIs.
2. Snapshot/event metadata for bright red ordinary rings, plus lab controller/manual controls.
3. Villain illustration/animation and short local cue with pause/mute/restart/disposal cleanup.
4. Tests for successful/failed/duplicate/stale/post-win requests, count invariants, unique IDs after removals, classic timer reset and same-tick victory ordering.
5. Prove 14-ring classic capacity with physical stacking and pump/inversion tests in both models, then compare 1 versus 2 added rings against all themes.

Fourteen bodies would increase ring colliders from 240 to 280 (+16.7%). Geometry suggests seven rings per peg may fit, but this is an inference: capacity, performance and fairness with 14 have **not** been tested. The review did not run enemy simulations or audition a villain cue. Actual-device acceptance remains not run.

Open product choices for the POC: final villain design/cue, whether the one-encounter cap feels right, and later timing. The recommended initial manual/atomic trigger makes those comparisons bounded without committing the normal game to interruptions.
