# Integrated player readiness — October 20, 2026

**Decision:** ready for continued local play and player review. Full Android/iOS acceptance is **not established**. Physical sensors, two independent fingers, sustained device FPS and acoustic audition remain not run. T12 is the completed readiness audit; it does not convert these gaps into passes or authorize publication.

Source candidate: `611ae64` (integration `ad730e0`, fresh-world correction `a1ebc32`). Final content build: **b6c3db9f**. Final changes after the complete test run were CSS-only compact-screen fixes, verified in the browser. All work remains local; no paid access, account, tunnel or deployment was created.

## Delivered behavior and entries

- `/`: Spanish setup and game flow, fixed one/two-button models, collect initially selected and classic available, three themes, manual/sensor paths, settings/pause/help, restart confirmation and local preferences.
- `/lab.html`: preserved POC scenes, camera experiments, tuning, collision debug and diagnostics.
- `/preview.html?scene=stack`: explicit testing entry for the player using a controlled physical scene. Also accepts `free`, `drop`, `depth`. Normal `/` ignores scene query parameters.
- Themes preserve the round. Model/mode changes return to setup and Jugar starts another round. Reload restores preferences into fresh setup, without restoring bodies/progress/rule mode.
- Web Audio effects are synthesized locally; inline SVG mascots dance with perimeter confetti. Both transient feedback and celebration ignore pointer input and stay above the pump deck. Effects clear on restart; pause freezes the four-second celebration lifetime.
- The static bundle contains all theme/art/audio definitions. Styles use system fonts, with no Google Fonts import. No PWA/cold offline behavior is claimed.

Workers T07, T08, T09 and T10 used `gpt-6-luna` with `high` reasoning effort in isolated worktrees. The parent integrated/reviewed the changes, completed T06's free baseline, and performed T11/T12 composition and browser checks. T09 stays in review only for the unperformed subjective acoustic check; its implementation and lifecycle tests are integrated.

## Automated checks

`pnpm typecheck`, `pnpm test` and `pnpm build` passed against integrated source `ad730e0`. The complete suite passed **53/53**: 16 physics, 10 session, 8 input, 6 preference, 4 model, 3 theme, 4 audio and 2 celebration tests. The final CSS-only follow-up built successfully and had browser bounds rechecked. `git diff --check` passed.

The classic twelve-ring soak ran 72,000 steps / 600 simulated seconds without escapes or NaN. Latest complete execution: 23.323 s, mean engine step 0.324 ms. This is local Node engine timing without drawing, not mobile FPS. Non-failing runtime notices came from Rapier's initializer and the Node loader/storage environment; they are not evidence of browser/mobile performance.

Parent review corrections include: camera degrees versus radians, visual pedestal height matching physical contact, duplicate decorative pump meshes, pause/draft-choice behavior, feedback intercepting pumps, and short-screen control accessibility.

### Restart regression

The controlled collect stack reproduced 12/12 on first creation but 11/12 after an immediate identical restart. The new session test failed with `11 !== 12`. Isolating world reuse reproduced the differing outcome with or without per-frame gravity updates. Recreating Rapier's world at round boundaries restored 12/12 in each case, with the same collider geometry, strength 75, drag 0.50, 120 Hz step and 0.12-second physical contact rule. The regression now covers repeat rounds and victory identity; the full physics soak also passed afterward.

A separate classic integration test verifies pause time does not count, losing a threaded ring resets the two-second interval, rethreading after victory does not celebrate again, and a new round can celebrate.

## Browser evidence

Environment: Codex in-app desktop browser, user agent reports Chrome 155 on Macintosh, device pixel ratio 2. Viewport sizes below are desktop emulation, not named physical phones/tablets.

- Twelve combinations (two models × three themes × two rules) completed the real-physics controlled stack at build `9611e77a`. Each reported 12/12 and the matching octopus/astronaut/capybara. [Matrix](evidence/player-model-theme-mode-cases.json).
- All six collect combinations were rechecked on final build `b6c3db9f`. Feedback/celebration had `pointer-events: none`, and the feedback bounds stayed above pumps. [Final recheck](evidence/player-final-collect-cases.json).
- Bounds were measured at **360×640, 375×667, 390×844, 844×390, 768×1024, 1024×768**, including the long unavailable-sensor message. No horizontal page overflow; visible pumps were at least 52 px high, below the tank. Sensor and recenter actions remained within the viewport. [Bounds](evidence/player-layouts.json), [compact portrait](evidence/player-final-360x640.png), [landscape](evidence/player-final-844x390.png).
- With 1/2 collected in the drop preview, theme changes preserved progress; manual pause remained after closing settings. Cancel restart kept 1/2; confirm showed fresh 0/2 then recollected normally.
- Reload restored theme/model/mute choices and returned to fresh setup with collect selected. Changing models returned to setup; changing theme did not replace an uncommitted model choice. Help matched the selected rule. Round-only settings were disabled before Jugar.
- Desktop activation with no sensor data fell back to Spanish manual help; inversion/sliders/pumps remained available. Permission grant/denial on actual mobile browsers is not claimed by this observation.
- The local HTTP server was suspended after loading. All three themes switched with progress staying 1/2 and sound preference retained; pumping and manual inversion still worked. No captured console errors. The server was resumed immediately afterward. [Offline-after-load record](evidence/player-offline-themes.json). This tested absence of the local serving origin, not cold offline startup.
- The preserved lab completed 12/12 in collect stack and its 15° camera preset updated coordinates. Normal play retains the fixed 0.7° camera.
- No error-level browser console entries were captured during the final checks. The last local page is the normal two-button/ocean/collect game.

Visual evidence: [player phone layout](evidence/aritos-player-phone.png), [player desktop layout](evidence/aritos-player-desktop.png), [space celebration](evidence/player-space-two-button.png), [capybara celebration](evidence/player-capybaras-single-button.png).

## Acceptance matrix

“Pass” below applies only to the evidence class stated, never to untested hardware. “Partial” preserves specific missing observations.

| Criterion | Result | Evidence / remaining limitation |
| --- | --- | --- |
| CA-01 | pass — engine / desktop | Aligned versus offset drop tests and real-physics preview; no false progress. |
| CA-02 | pass — engine / prior desktop | Depth overlap tests retained; new renderer consumes the same physical poses, without scoring logic. |
| CA-03 | pass — engine | Twelve rings stack and extract under inversion; physical device handling not run. |
| CA-04 | partial | Single press, repeat/cancel/focus and two synthetic pointer IDs pass; actual two-finger interaction not run. |
| CA-05 | pass — engine | Containment/inversion/pump tests and 600-second soak; not an exhaustive device stress guarantee. |
| CA-06 | partial | Twelve-ring engine soak passes. Ten active minutes with drawing and sustained FPS on reference mobiles not run. |
| CA-07 | pass — automated | Real classic victory occurs at the same active tick under even/uneven frame schedules. |
| CA-08 | partial | Deterministic denied/error/no-data cases and desktop no-data/manual fallback pass; real phone permissions not run. |
| CA-09 | partial | Six emulated viewports and synthetic screen-remapping tests pass; physical sensor remapping remains unverified. |
| CA-10 | historical acceptance / review | Accepted POC tuning preserved; user play feedback on the new visuals remains to be collected. |
| CA-11 | pass — desktop | All six model/theme combinations in both modes, including actual physical preview victories. |
| CA-12 | partial | Paused theme switch preserves observed progress/scene; renderer has no Rapier adapter. Numerical before/after velocity/pose captures were not collected. |
| CA-13 | pass — automated | Loss of a threaded ring resets classic active-time interval; pause cannot complete it. |
| CA-14 | pass — desktop / automated | Correct dancing mascot/confetti after actual classic victory; input layers do not intercept pumps. |
| CA-15 | pass — automated / desktop preview | Victory latch, extraction/rethreading, fresh-round reset and stale-effect cleanup; each preview round celebrates. |
| CA-16 | partial | Settings/manual pause behavior passes in browser; hidden-time/no-backlog passes in session fixtures. Native device background cycle not run. |
| CA-17 | pass — desktop / automated | Cancel keeps round; confirm creates fresh round and resets effects. Reduced lab scenes keep their initial target; normal play uses twelve. |
| CA-18 | pass — desktop | Preferences restored; initial collect setup and fresh physical state; no round serialization. |
| CA-19 | partial | Browser mute restoration and automated silence/lifecycle tests pass. Subjective desktop/device audition not performed. No music implementation. |
| CA-20 | pass — desktop | Loaded game switches all themes and accepts inputs with local serving process stopped. |
| CA-21 | partial | Registered desktop viewport matrix passed; actual Android Chrome and iOS/iPadOS Safari remain not run. |

## Remaining review

1. Listen to effects in the actual browser/device and adjust only their mix/timbre if needed; T09 remains review until that observation is recorded.
2. When a free or borrowed device is available, register Android/iOS versions and test actual permissions, calibrated full inversion, independent simultaneous fingers, native background/orientation and sustained game-side FPS.
3. Collect the user's feedback on the new appearance and free-play experience. Preserve accepted physics tuning unless an observed regression or explicit user decision requires a change.

These observations do not block further development under requirements section 15. Full mobile compatibility/performance is not accepted, and deployment remains a separate action.
