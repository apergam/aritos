# T02 — Complete input and orientation control

Dependencies: T01.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), and `docs/module-contracts.md`. Follow the guide's shared verification and handoff rules.

## Outcome and current state

The POC already has pump buttons, keyboard control, sensor activation, calibration, and manual inversion. Harden these into one input controller; do not replace them with left/right-only tilt or claim real sensor validation from synthetic vectors.

## Ownership

Own the input module extracted by T01 (`src/input/`) and its focused tests. Consume the session/model contracts. Do not edit shared composition, the renderer, or physics tuning; supply integration instructions for T06/T11.

## Work and acceptance

- One pulse per press, including keyboard repeat suppression. Support two simultaneous pointers and simultaneous pump/orientation input.
- Clean up pointer cancellation, key releases, blur, and listener disposal without stuck commands or duplicate listeners after restart.
- Request sensor permission from explicit interaction only when needed; represent denied, unavailable, waiting, usable, and unusable-data states. Always retain a usable manual path.
- Support sideways and forward/backward rotation, recentering, and full inversion. Adapt screen orientation without resetting the round or generating a pump pulse.
- Do not consume game shortcuts while editing controls. Prevent accidental page gestures only where necessary, keeping settings usable.
- Supply concise Spanish capability/help messages and shortcut data to the UI contract.

## Verification and handoff

Exercise held keys/buttons, two-button activation, cancellation, permission denial/errors, no data, calibration, and portrait/landscape remapping. Use deterministic tests for input-state transitions and gravity math; verify browser interactions and record limitations. Typecheck, tests, and build pass. Actual Android/iOS acceptance belongs to T06, not a claim in this card's automated results.

Coverage: RF-11–RF-12, RF-17–RF-24; RT-07–RT-08, RT-11; CA-04, CA-08–CA-09.
