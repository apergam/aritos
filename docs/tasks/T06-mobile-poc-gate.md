# T06 — Pass the mobile POC gate

Dependencies: T02, T03, T04.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), `docs/module-contracts.md`, and the [manual POC protocol](../POC_REPORT.md). Follow shared verification/handoff rules.

## Outcome and access needed

Validate the accepted mechanics and integrated controls on registered real reference devices before themes, audio, or mascots begin. Local engine tests and desktop viewport emulation are insufficient. Obtain the user's available Android and iPhone/iPad device details and an authorized HTTPS test origin. If unavailable, record the gap and leave this task blocked.

## Ownership

Own `docs/validation/mobile-poc.md` and its diagnostic evidence manifest. During this wave only, own minimal `src/app/` composition changes needed to wire the completed control/session/model modules into the existing lab. Coordinate defect fixes back to the owning modules; no polish or unrelated retuning.

## Work and acceptance

- Register model, OS, browser/version, orientation, build/commit, and graphics settings before making acceptance claims.
- Run CA-01–CA-10 and the POC manual protocol, including both models and both rule modes where applicable.
- Verify actual permission grant/denial/no-data paths, comfortable calibration, full inversion, simultaneous touch, manual orientation plus pumping, and portrait/landscape changes without losing state.
- Run ten active minutes with twelve classic rings so collection cannot hide body loss or reduce the physics load. Separately verify accumulated progress and remaining-body accounting in collect mode.
- Record sustained FPS and diagnostics on the devices tested. Resolve reproducible escapes, tunneling, dead controls, or prolonged sub-30 FPS before passing the gate.
- Confirm accepted feel remains intact after module changes; preserve the existing user acceptance unless a regression requires new tuning.

## Verification and handoff

Produce a pass/fail/not-run matrix with exact steps, diagnostics, limitations, and any fixes. Code changes pass typecheck, tests, and build. Never mark untested devices passed or publish/replace the hosted site without authorization. Gate completion requires the real-device evidence; a prepared protocol alone does not unlock T08–T10.

Coverage: RF-06–RF-24; RT-07–RT-09, RT-11, RT-14; CA-01–CA-10.
