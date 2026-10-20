# T04 — Define and enforce toy models

Dependencies: T01.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), and `docs/module-contracts.md`. Follow shared verification/handoff rules.

## Outcome and current state

The POC has working one- and two-button variants with fixed outlet definitions. Make them complete model definitions consumed by inputs, physics, rendering, and UI, rather than scattered numeric branches.

## Ownership

Own `src/models/` and model-contract tests. Supply a registry and selection metadata; do not edit the shared composition entry point or theme/rendering modules.

## Work and acceptance

- Define stable model IDs, button count, pump-side mapping, outlet positions/directions, and shared accepted tank/peg/ring configuration.
- Preserve the existing central outlet and lower side jets. Do not retune strength 75, damping 0.50, or geometry as part of this extraction.
- The two-button model supports both pumps together; the one-button model exposes only its central pump.
- Model definitions contain mechanics, not theme colors, art, sounds, or mascots. Every theme must be able to use either model.
- Default to two buttons when no valid preference exists. Selection starts a new round; do not change button count in a live round.
- Both models retain twelve rings, two pegs, and valid classic capacity for twelve threaded rings.

## Verification and handoff

Verify model-to-input mapping and generated outlet data against the accepted definitions. Exercise a pulse in each model and simultaneous side pulses, and retain threading/stacking/extraction checks. Typecheck, tests, and build pass. Provide the registry contract and UI/renderer integration examples; leave theme combinations to T08/T12.

Coverage: RF-01–RF-05, RF-11–RF-13; CA-04, CA-11.
