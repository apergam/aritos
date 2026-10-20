# T01–T05 integration evidence

Completed locally on October 19, 2026 (America/Mexico_City). Integrated source commit: `c346c1b`. Final browser build: **f930b866**. This is the pre-mobile implementation wave; it is not a full release or mobile acceptance.

## Assignments and result

Every implementation worker used the user-selected `gpt-6-luna` model with `high` reasoning effort in an isolated worktree. The parent reviewed, requested fixes, cherry-picked selective source commits, and wired the modules into the existing lab. No worker pushed or published.

| Task | Integrated result | Mainline commits |
| --- | --- | --- |
| T01 | Physics/session/input/rendering/lab/preferences boundaries and immutable snapshots; original mechanics retained. | `e51b22c` |
| T02 | One pulse per pointer/key edge, simultaneous sides, cancellation/focus cleanup, accessible pump activation, explicit sensor capability states, calibration and manual fallback. | `d734b0a`, `ac15838`, `e6fa2d2`, `cb49385` |
| T03 | Independent pause reasons, fresh model/mode rounds, safe restart, collection-before-victory events, stale-event suppression, and active-time rules. | `377f586`, `09aa271` |
| T04 | Frozen mechanics registry consumed by physics/lab/controls, with accepted geometry, outlets and tuning. | `9aff901`, integration `c346c1b` |
| T05 | Validated versioned preferences and storage failure fallback. Startup restores model only into a fresh collect round; motion permission remains explicit. | `2d8d62b`, integration `c346c1b` |

Parent review caught a victory callback running before Rapier finished its tick, a late sensor grant overriding a manual choice, inaccessible keyboard pump activation, and stuck/focused keyboard-state cases. Follow-up fixes include regression coverage rather than relying solely on the first worker result.

## Automated evidence

- `pnpm typecheck`: passed.
- `pnpm test`: **42/42 passed** (16 physics, 8 input, 8 session, 6 preferences, 4 model tests).
- `pnpm build`: passed, `POC / f930b866`.
- `git diff --check`: passed.
- Existing twelve-ring classic soak: 72,000 steps / 600 simulated seconds; no escapes or NaN. Latest execution took 23.582 seconds, mean engine step 0.328 ms. This measures the local engine without drawing, not mobile FPS.
- Real-physics lifecycle tests cover collection events before victory, disposal/restart from victory listeners, and classic two-second victory at the same active tick under even and uneven drawing schedules. Hidden steps cannot advance active time.
- Storage tests cover absent/corrupt/partial/unsupported payloads, read/write exceptions, inaccessible storage getter and allowlisted serialization without round state.

## Parent browser evidence

Codex in-app desktop browser, user agent reports Chrome 155 / Macintosh, viewport 1280×720, device pixel ratio 2. Core integration checks used build `926566c0`; final focus/shortcut checks and diagnostic export used `f930b866` (only input cleanup changed between them).

| Check | Observed result |
| --- | --- |
| Classic drop | Aligned ring threads; count 1/2. |
| Restart and model switch while manually paused | Pause survives, center model exposes one pump, new round starts at 0/2. |
| Reload after selecting central model | Model persists; fresh free scene, collect mode, 0/12 and manual control. No round is restored. |
| Collect stack | Twelve rings removed, counter 12/12 and objective message. Pumping and manual inversion do not decrease progress. |
| Classic stack / inversion | 12/12 threaded; inversion extracts rings and count reaches 0/12. |
| Depth scene | 1/2; screen overlap gives no false extra progress. |
| Sensor activation with no desktop data | Waiting changes to unavailable; Spanish manual-control help remains. Actual mobile permission paths remain unverified. |
| Focused scene button + P | Pauses and resumes. Focused pump + Space/Enter activates without relying on a pointer. |
| Camera | 15° preset updates coordinates; original 0.7° view restored. |
| Diagnostics / console | JSON downloads; no captured error logs. |

The final lab is left in two-button free play, collect mode, original camera, strength 75 and drag 0.50. Proof: [full-page screenshot](evidence/desktop-f930b866.png), [exported diagnostic](evidence/desktop-f930b866.json). The diagnostic contains a point-in-time 60 FPS desktop readout; it does not prove sustained performance on reference mobiles.

## Remaining gate

T06 is blocked on real-device/secure-origin access. The user has no devices available and declined paid cloud-device access for this experiment. No account, tunnel, subscription or deployment was created. See the [mobile access investigation](mobile-access.md) and [not-run mobile matrix](mobile-poc.md).

No Android/iOS sensors, physical calibration/inversion, independent simultaneous contacts, orientation compatibility, or sustained mobile FPS are claimed passed. Themes, audio, celebration and later production tasks remain behind the documented gate. Browser/device emulation does not replace this evidence.
