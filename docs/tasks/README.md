# Agent task board

Read the [implementation guide](../implementation-guide.md) before claiming work. Each row represents one agent-sized assignment. This board is the single source for status, owner, and integration evidence; task cards define dependencies and scope. Implementation was started at the user’s request. Workers use `gpt-6-luna` with `high` reasoning effort; the parent orchestrator owns assignment, integration, and evidence.

Status values: `planned`, `in-progress`, `blocked`, `review`, `done`. Only mark a task `done` after integration and recorded evidence. Dependencies refer to integrated tasks. T01 was the initial prerequisite; current assignments and completion evidence are recorded below; T06 runs in parallel using free tools and is not a dependency of later implementation. Missing real-device access is recorded as not run; it does not prevent the T06 baseline report or T12 readiness report. Full mobile acceptance still requires actual device evidence.

| ID | Task | Dependencies | Status | Owner | Integrated commit / evidence |
| --- | --- | --- | --- | --- | --- |
| T01 | [Extract module boundaries and contracts](T01-module-boundaries.md) | None | done | /root/t01 | `e51b22c`; 18 tests, typecheck/build; parent browser comparison of four scenes, inversion, camera and pump |
| T02 | [Complete input and orientation control](T02-input-controls.md) | T01 | done | /root/t02 | `d734b0a`, `ac15838`, `e6fa2d2`, `cb49385`; integrated by `c346c1b`; [evidence](../validation/integration-t01-t05.md) |
| T03 | [Complete round lifecycle and rules](T03-round-lifecycle.md) | T01 | done | /root/t03 | `377f586`, `09aa271`; integrated by `c346c1b`; [evidence](../validation/integration-t01-t05.md) |
| T04 | [Define and enforce toy models](T04-toy-models.md) | T01 | done | /root/t04 | `9aff901`; registry consumed by physics/lab in `c346c1b`; [evidence](../validation/integration-t01-t05.md) |
| T05 | [Persist preferences safely](T05-preferences.md) | T01 | done | /root/t05 | `2d8d62b`; startup persistence in `c346c1b`; [evidence](../validation/integration-t01-t05.md) |
| T06 | [Run free mobile validation](T06-mobile-poc-gate.md) | T02, T03, T04 | done | Parent | [Free baseline](../validation/mobile-poc.md); laboratory scroll finding resolved in production; physical acceptance not run |
| T07 | [Build the Spanish player interface](T07-player-interface.md) | T02, T03, T04, T05 | done | /root/t07 | `1622ce9`, `8231200`, `9e9935d`; parent UI fixes and six-size bounds in `611ae64`; [release evidence](../validation/release.md) |
| T08 | [Implement complete themes](T08-themes.md) | T01, T04 | done | /root/t08 | `3da4508`, `25daa58`, `37224fb`; all six model/theme combinations in both modes; [evidence](../validation/release.md) |
| T09 | [Implement sound effects](T09-audio.md) | T03, T05 | review | /root/t09 | `c069ac0`; synthesis integrated in `ad730e0`, four lifecycle tests and browser mute persistence; subjective audition not run |
| T10 | [Implement themed celebration](T10-celebration.md) | T03, T08 | done | /root/t10 | `76aab6e`; correct mascot and once-per-round celebration in real physical previews; [evidence](../validation/release.md) |
| T11 | [Integrate the production app and assets](T11-production-integration.md) | T07, T08, T09, T10 | done | Parent | `ad730e0`, `611ae64`; player/lab routing, inline assets and offline-after-load checks; [evidence](../validation/release.md) |
| T12 | [Verify the complete release](T12-release-validation.md) | T11 | done | Parent | [Qualified readiness report](../validation/release.md); 53 tests; physical mobile criteria and acoustic review remain explicitly not run |

For an assignment, provide the agent with exactly one task path and the prompt from the guide. Record a branch/commit only after it actually exists. Do not assign overlapping shared-file ownership to parallel agents.

## Polish backlog — recorded October 20

These eight cards capture the user's seven ideas; sound effects and music are separate assignments. The user selected T14/T15/T16, then T17/T19, and later selected width8/raised pegs for normal play. T14 and T16 ran in parallel, followed by T15 on the integrated audio base. All three are integrated; the two audio cards await subjective listening. Geometry experiments were initially deferred, then authorized; the later selected geometry is recorded in requirements section 21. T14/T15 share audio ownership and T16/T17 share theme/rendering ownership, so serialize each pair or explicitly separate files/contracts before parallel work.

| ID | Task | Dependencies | Status | Owner | Evidence / next decision |
| --- | --- | --- | --- | --- | --- |
| T13 | [Compare a narrower toy](T13-narrower-tank-poc.md) | T04, T11 | review | /root/t13_width + Parent | `b38607f`, `bba4227`; widths9/8/7. Width8 selected for normal play; [normal integration · 145 tests](../validation/selected-toy-integration.md); lab comparison: [report](../validation/lab-experiments.md) |
| T14 | [Improve collection reward sound](T14-collection-reward-sound.md) | T09 implementation, T11 | review | /root/t14_reward | `272cbdd`, `29a3972`, integration `c25218a`; two saved cues + browser samples; [evidence](../validation/polish-audio-art.md); user audition pending |
| T15 | [Add theme music loops](T15-theme-music.md) | T09 implementation, T08, T11 | review | /root/t15_music | `ff51cab`, integration `c25218a`, contrast fix `76c890a`; original local loops, seven lifecycle/sample tests; [evidence](../validation/polish-audio-art.md); listening/mix review pending |
| T16 | [Illustrate rear plastic inserts](T16-themed-rear-inserts.md) | T08, T11 | review | Parent | Original worker implementation `45a9b69`, `a01ac11`; replacement illustrated scenes `11ab2c9`, matched space `d0c5503`; ocean/capybaras accepted by user; [current evidence](../validation/art-refresh.md); space visual feedback pending |
| T17 | [Explore themed rings](T17-themed-rings.md) | T08, T11 | review | /root/t17_rings + Parent | `e43a0b5`; integrated finishes, both models/all themes; [evidence](../validation/themed-rings-stickers.md); user visual feedback pending |
| T18 | [Compare twelve and twenty rings](T18-twenty-rings-poc.md) | T04, T03, T11 | planned | Unassigned | `db122af`, `a2f6003`; genuine20-ring stack/contact, four600s stress runs; [lab evidence](../validation/lab-experiments.md); twenty remains deferred in normal play |
| T19 | [Prototype earned stickers](T19-sticker-rewards-poc.md) | T03, T05, T08, T11 | review | /root/t19_stickers + Parent | `5f6c343`, `edc6c4a`, `5fec360`, `b0434df`, `1993b56`; [integrated candidate](../validation/themed-rings-stickers.md), requirements §19; user reward/placement feedback pending |
| T20 | [Prototype alternate peg positions](T20-alternate-peg-poc.md) | T04, T03, T11 | review | /root/t13_width + Parent | `d758c70`; raised supported pegs selected for normal play; [normal integration · 145 tests](../validation/selected-toy-integration.md); lab report: [comparison](../validation/lab-experiments.md) |

The older deferred ideas also remain: BL-01 time trial, BL-04 broader customization editor, BL-05 physical shaking and BL-06 installation/cold offline launch. BL-02 collection is implemented; BL-03 now has the bounded T18 experiment. These older ideas have no implementation card/assignment yet.

## Pressure and arcade backlog — recorded October 20

The original three laboratory experiments are implemented. After user review, T21 returns to the planned backlog for further input-design work; its historical POC remains available. T22 and T23 are selected for normal play with explicit manual activation and no economy. T23 changes totals only after a successful bounded encounter. All three need integration-owner coordination across inputs/physics/session/rendering; do not assign overlapping shared-file ownership in parallel.

| ID | Task | Dependencies | Status | Owner | Evidence / next decision |
| --- | --- | --- | --- | --- | --- |
| T21 | [Prototype variable pump pressure](T21-variable-pressure-poc.md) | T02, T04, T11 | planned | Unassigned | `29954f0`, `6652b0c`, `a119446`; four lab input modes/per-pulse force; [evidence](../validation/lab-experiments.md); fixed 75 remains normal |
| T22 | [Explore mascot powerups](T22-mascot-powerups-poc.md) | T03, T08, T10, T11 | review | /root/t13_width + Parent | `bbdce98`, `2288b2c`; both manual scripted assists selected for normal play; [normal integration · 145 tests](../validation/selected-toy-integration.md); lab evidence: [report](../validation/lab-experiments.md) |
| T23 | [Explore villain encounters](T23-villain-extra-rings-poc.md) | T03, T04, T08, T09 implementation, T11; coordinate T15 | review | /root/t23_enemies + Parent | `6bb58f4`, `4b3584b`, `a119446`; one manual encounter per round selected, +1/+2 physical rings, max14; [normal integration · 145 tests](../validation/selected-toy-integration.md) |

## Next review

POCs T13/T18/T20/T21/T22/T23 are integrated in laboratory build **2005c319**, with [comparison and evidence](../validation/lab-experiments.md). The user has since selected width8, raised pegs, both manual mascot assists, and one manual villain encounter per round for normal play; the selected integration validation is [recorded](../validation/selected-toy-integration.md). T18's twenty-ring count and T21's variable-pressure controls remain deferred from normal play. Keep production count at12 and strength at75; do not add pressure sliders. The width9 floor arrangement remains the historical comparison baseline.

T17/T19 are also available; the user gave positive feedback on the direction. Exact finish/reward cadence and the existing acoustic review remain open. Actual Android/iOS pressure/sensors, independent fingers and sustained mobile FPS remain not run until free hardware is available. No paid service, deployment or push is part of this iteration.


## October21 — automatic linked villain selected

T23 now includes the explicitly requested automatic normal-game encounter with1–5 rings remaining and a linked pair. The earlier manual-only notes are historical. The new schedule and physical chain are tracked in [current validation](../validation/automatic-linked-villain.md); no chain bonus or unlimited respawning is included.
