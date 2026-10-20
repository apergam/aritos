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

These eight planned cards capture the user's seven ideas; sound effects and music are separate assignments. No worker is assigned and no code change is started. Suggested first comparisons are T13 and T14; this order is a recommendation, not a scheduled iteration. Run geometry experiments separately before combining candidates. T14/T15 share audio ownership and T16/T17 share theme/rendering ownership, so serialize each pair or explicitly separate files/contracts before parallel work.

| ID | Task | Dependencies | Status | Owner | Evidence / next decision |
| --- | --- | --- | --- | --- | --- |
| T13 | [Compare a narrower toy](T13-narrower-tank-poc.md) | T04, T11 | planned | Unassigned | Lab comparison; user selects width before production adoption |
| T14 | [Improve collection reward sound](T14-collection-reward-sound.md) | T09 implementation, T11 | planned | Unassigned | Coin-like/sparkling audition; listening still pending |
| T15 | [Add theme music loops](T15-theme-music.md) | T09 implementation, T08, T11 | planned | Unassigned | Document rights, seamless loops and controls; new music scope |
| T16 | [Illustrate rear plastic inserts](T16-themed-rear-inserts.md) | T08, T11 | planned | Unassigned | Three themes, readable rings/pegs and preserved physical state |
| T17 | [Explore themed rings](T17-themed-rings.md) | T08, T11 | planned | Unassigned | Palette/decorative comparison; recheck with T16 art |
| T18 | [Compare twelve and twenty rings](T18-twenty-rings-poc.md) | T04, T03, T11 | planned | Unassigned | Existing BL-03; capacity, activity and performance comparison |
| T19 | [Prototype earned stickers](T19-sticker-rewards-poc.md) | T03, T05, T08, T11 | planned | Unassigned | Define reward rule, placement and local persistence |
| T20 | [Prototype alternate peg positions](T20-alternate-peg-poc.md) | T04, T03, T11 | planned | Unassigned | Raised/offset lab variants with matched physical bases |

The older deferred ideas also remain: BL-01 time trial, BL-04 broader customization editor, BL-05 physical shaking and BL-06 installation/cold offline launch. BL-02 collection is implemented; BL-03 now has the bounded T18 experiment. These older ideas have no implementation card/assignment yet.

## Pressure and arcade backlog — recorded October 20

Three additional lab experiments are planned. T22 contains the two requested powerup variants so they can be compared together; reward/activation rules are still open. T23 changes round totals only inside its opt-in experiment. All three need integration-owner coordination across inputs/physics/session/rendering; do not assign overlapping shared-file ownership in parallel.

| ID | Task | Dependencies | Status | Owner | Evidence / next decision |
| --- | --- | --- | --- | --- | --- |
| T21 | [Prototype variable pump pressure](T21-variable-pressure-poc.md) | T02, T04, T11 | planned | Unassigned | Fixed versus variable strength; genuine pressure versus accessible fallback and pulse timing |
| T22 | [Explore mascot powerups](T22-mascot-powerups-poc.md) | T03, T08, T10, T11 | planned | Unassigned | Thread a floor ring or release above peg; assisted rules, availability and charges undecided |
| T23 | [Explore villain encounters](T23-villain-extra-rings-poc.md) | T03, T04, T08, T09 implementation, T11; coordinate T15 | planned | Unassigned | Villain music/mascot, one/two bright added rings, safe spawning and updated objective |

## Next review

The October 20 implementation is available locally. The user praised the first version on October 20. Remaining review: listen to the synthesized effects in the actual browser/device and collect specific feedback on the planned comparisons; run real Android/iOS sensors, independent fingers and sustained FPS checks when free hardware access is available. T12 is a completed readiness audit, not a declaration that not-run mobile criteria passed. No paid service, cloud session or deployment was created.
