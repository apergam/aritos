# T21 — Prototype variable pump pressure

Dependencies: T02, T04, T11. Free lab/browser evidence is sufficient for exploration; unavailable hardware checks remain not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 17](../requirements.md#17-variable-pressure-and-arcade-experiments--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md). Planned only: recording this card starts no implementation or agents.

## Outcome and ownership

Explore a pump whose jet strength varies with the player's input, addressing the user's observation that every current press produces the same strength. Keep a switchable fixed-strength baseline in the lab; this task does not replace the normal player's controls.

Own a bounded input-to-pump-intensity experiment and focused input/physics checks. Coordinate input, pump command/event contracts, simulation, lab controls, renderer and feedback through the integration owner. Do not independently invent competing intensity contracts.

## Work and acceptance

- Compare the fixed 75 baseline with bounded low/medium/high intensities, and show the requested intensity and applied impulse in lab diagnostics. Hold geometry, drag 0.50, ring count and pulse duration fixed initially so the strength effect can be isolated.
- Investigate actual input capabilities before selecting a control. Do not assume ordinary phone screens or mice measure pressing force; distinguish measured hardware pressure from an approximation such as press duration, drag distance or an explicit strength control. Provide a usable desktop/touch fallback and label it honestly in the POC.
- Compare available genuine pressure input with a practical fallback where feasible. Document mapping, clamping, activation timing and the tradeoff between immediate pumping and charging/release. No unsupported device claim is required to complete the free POC.
- Preserve one bounded pulse per intentional press, independent values for simultaneous pumps, no auto-repeat while holding, and safe pointer/keyboard cancellation. If charging fires on release, make that timing explicit and clear it on cancellation, pause, focus loss or restart without releasing a stale pulse.
- Make the chosen intensity deterministic simulation input, independent of frame rate. Stronger settings must change actual local jet impulse, with feedback matched to the same command; never move rings by a fixed animation.
- Compare reach, control of the last few rings, containment and enjoyment in both models and rules. Keep fixed strength available and record the preferred mapping/range with the user before adopting it.

## Verification and handoff

Test intensity bounds, weak-versus-strong response in a controlled fixture, input duplication/cancellation, two independent pumps, pause/restart and equal physical outcomes under differing frame schedules. Run containment/stress checks at the strongest candidate plus typecheck/tests/build. Record browser/input device and whether pressure was real, emulated or approximated; capture lab settings and player feedback.

Coverage: BL-14; requirements section 17; RF-11–RF-14, RF-21–RF-24; CA-04–CA-05.
