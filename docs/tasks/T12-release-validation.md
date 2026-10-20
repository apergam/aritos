# T12 — Verify the complete release

Dependencies: T11.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), the [POC report](../POC_REPORT.md), and T06's mobile evidence. Follow shared verification/handoff rules.

## Outcome and access needed

Produce a release acceptance decision for the assembled game, not another POC claim. Real registered Android and iPhone/iPad devices and a user-authorized HTTPS origin are required. Missing access remains a recorded blocker; viewport emulation cannot close it.

## Ownership

Own `docs/validation/release.md`, its evidence manifest, and final documentation reconciliation. Report implementation failures to the corresponding module owner for fixes; coordinate any cross-module change with T11. Do not deploy or create accounts as part of validation.

## Work and acceptance

- Run CA-01–CA-21 against the integrated build and record pass/fail/not-run evidence for each. Preserve mode applicability: classic keeps physical extraction and two-second victory; collect requires real base contact and irreversible per-round progress.
- Cover all six model/theme combinations in each rule mode, portrait/landscape, reload preferences/new round, and continued play/restart after victory.
- Verify actual sensors and denial/no-data fallbacks, calibration, inversion, simultaneous touch, menu/background pause, restart cancellation, and orientation changes without state loss.
- Run ten active minutes with twelve classic rings on each reference device/configuration; record sustained FPS, physics timing, body integrity, and diagnostics. Separately test collection count integrity and victory.
- Verify theme switching preserves bodies/poses/velocities/progress, mute survives reload, and all themes work after disconnecting following full loading.
- Regress the accepted feel after visual integration. If a performance fix is needed, reduce visual effects first, not rule accuracy or physics stability.

## Verification and handoff

Run typecheck, tests, and build for the exact candidate commit. Record hardware, software versions, build, graphics settings, steps, results, and diagnostic locations. Reconcile documented limitations and task evidence with reality. Produce a ready/not-ready decision and unresolved issues; leave failed or not-run criteria visible. Deployment requires a separate user instruction.

Coverage: RF-01–RF-45; RT-01–RT-14; CA-01–CA-21; collect-mode section 13. BL-01 and BL-03–BL-06 remain excluded.
