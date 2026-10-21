# T24 — Redesign the mobile interface

Dependencies: T07, T08, T11; preserve T17/T19/T22/T23 integration. Owner: Parent. Status: review (implemented, awaiting Pixel feedback).

## Outcome

Use the mobile screen primarily for the physical toy, with pumps permanently reachable below it. Keep setup concise, with model/theme/mode choices and a visible Jugar action. See requirements §24.

## Acceptance

- Use the dynamic viewport and safe areas without clipping the toy or essential controls; support portrait and landscape without restarting the round.
- Offer inclination and mascots in an on-demand nonmodal panel; preserve two-axis tilt/inversion/recenter, explicit motion permission and simultaneous pump access.
- Keep both models, both rules, theme/preference behavior, pause/restart cancellation, decoration and persistent victory/new-game behavior.
- Improve camera fit without altering angle, physics, pulse strength, ring counts, helper mechanics or the automatic linked villain.
- Retain keyboard/focus behavior; make compact panel dismissal accessible even when its content scrolls.
- Record free browser checks, screenshots, automated results and unresolved physical-device acceptance. No paid services or deployment.

## Evidence

[Integrated local candidate](../validation/mobile-interface.md): build 019e6188, 160/160 tests, TypeScript/build/diff checks; ten viewport layouts and browser interactions. Physical Pixel review, sensors, independent fingers and sustained mobile FPS remain pending.
