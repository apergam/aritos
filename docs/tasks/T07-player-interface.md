# T07 — Build the Spanish player interface

Dependencies: T02, T03, T04, T05, T06.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), and `docs/module-contracts.md`. Follow shared verification/handoff rules.

## Outcome and ownership

The laboratory is not the final player flow. Build a responsive Spanish interface in `src/ui/` and UI-owned styles/components. Consume input, session, model, and preference contracts. Supply a mount/dispose API and wiring notes to T11; do not edit its shared HTML/composition entry point.

## Work and acceptance

- Provide model/theme selection, brief initial help, motion activation/fallback messages, and a clear start action. Offer two buttons without a saved model preference; retain collect as the initial rule mode with classic available.
- Keep pump buttons below the toy, visible and comfortable in portrait and landscape. Manual orientation must include depth/inversion and remain usable while pumping.
- Add settings for pause, theme, sound, controls, recenter, and restart. Use session pause reasons rather than stopping/recreating the world in UI code.
- Restart confirmation supports cancel without state loss. Changing models leaves the round and starts another; changing themes preserves it.
- Display stable progress denominators for both rules and non-blocking collection/victory feedback. Keep player copy in Spanish.
- Keep lab camera sliders, physics tuning, collision debug, and technical diagnostics out of the normal player flow. Preserve them for T11's lab path.

## Verification and handoff

Exercise the user flow and menu actions in a browser at phone/tablet portrait, landscape, and desktop layouts. Confirm keyboard/focus behavior, no clipped essential controls, and simultaneous pumping/orientation. Verify canceling restart and theme selection preserve state via the session contract. Typecheck, tests, and build pass; leave final real-device acceptance to T12.

Coverage: RF-20–RF-24, RF-39–RF-42; RT-08; CA-08–CA-09, CA-16–CA-17, CA-21.
