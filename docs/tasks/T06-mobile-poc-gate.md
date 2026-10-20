# T06 — Run free mobile validation in parallel

Dependencies: T02, T03, T04. **Non-blocking:** no later implementation task depends on T06. The user replaced the former real-device development gate on October 19, 2026; see [requirements section 15](../requirements.md#15-free-parallel-validation-decision--october-19-2026).

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), [module contracts](../module-contracts.md), [free access options](../validation/mobile-access.md), and [manual POC protocol](../POC_REPORT.md).

## Outcome and ownership

Produce useful mobile-oriented evidence with zero paid-service spending while UI, themes, audio, celebration and integration continue. Own `docs/validation/mobile-poc.md`, its evidence manifest, and focused validation fixtures if needed. Keep test findings separate from implementation ownership. Do not edit shared app composition while T07–T11 are active; route reproducible defects to the relevant owner and coordinate any shared-file fix with the parent.

## Required free baseline

- Run available automated input/session/physics checks and compare active-time behavior across render schedules. Preserve strength 75, drag 0.50 and both rule modes.
- Exercise phone/tablet portrait and landscape layouts in available desktop browser tooling. Record actual viewport, browser/version and build; label these runs **desktop emulation**, not physical devices.
- Use DevTools sensor emulation or deterministic fixtures for both tilt axes, full inversion, screen remapping, permission denial/error/no-data and manual fallback. Record whether an observation came from browser interaction or an automated fixture.
- Exercise one pulse per press, keyboard/focus/cancel behavior and simulated simultaneous inputs; distinguish synthetic contacts from two physical fingers. Verify pumping and manual tilt can be used together.
- Cover CA-01–CA-10 as applicable, both models and both rules. Run the twelve-ring classic soak; record engine timing separately from rendering FPS. Collection must not hide missing bodies or reduce the classic load.
- Use locally available Android/iOS emulators when practical. Do not make a large installation or an emulator a new prerequisite; document missing tools and prioritize existing free browser/automated coverage.
- Produce pass/fail/not-run results, reproduction steps, diagnostic locations and remaining device risks. Fix or assign reproducible regressions to their module owners rather than silently treating them as unavailable access.

## Optional physical checks at no cost

When access exists, use a borrowed/user-owned phone with USB/local debugging or an authorized temporary HTTPS link. Android Device Streaming has a documented free Spark quota; check remaining quota/availability before use and stop within the free allowance. No paid subscription, billing upgrade or paid overage is authorized. Neither a cloud account nor a phone is required to complete the free baseline.

On actual hardware, register device/OS/browser/build/graphics settings. Test physical calibration, inversion, independent simultaneous fingers, permissions and ten active minutes of game-side FPS. A remote rotation control or synthetic input does not prove those physical interactions. No public tunnel, deployment or account setup is created as an incidental documentation/test step.

## Completion and handoff

T06 can be marked done when the required free baseline has an integrated report with actual evidence and explicit unresolved/not-run items. A prepared protocol alone is insufficient. Missing physical-device evidence remains listed for later follow-up and T12; it does not block T07–T11 or make emulation equivalent to real-device acceptance. Actual test failures must remain visible and be assigned for repair.

Code/fixture changes pass appropriate typecheck, tests and build; documentation-only updates use link/consistency checks. Full mobile compatibility, sensor behavior and sustained device FPS are accepted only with corresponding real-device evidence. No publication is part of this task.

Coverage: RF-06–RF-24; RT-07–RT-09, RT-11, RT-14; CA-01–CA-10. Coverage is a checklist, not a pass claim.
