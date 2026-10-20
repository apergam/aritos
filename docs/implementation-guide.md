# Aritos implementation guide

This is an execution plan for evolving the accepted POC into the specified game. It does not start agents, approve deployment, or declare the full release complete. Assign one task card to each agent; agree on the implementation iteration before starting it.

## Read first

1. [Repository instructions](../AGENTS.md).
2. [Requirements](requirements.md), including the collect-mode amendment and POC acceptance in sections 13–14.
3. [POC report](POC_REPORT.md) and [README](../README.md).
4. [Task board](tasks/README.md), then the assigned card.

The user’s October 19 update in requirements section 15 replaces the former T06 development gate with free, parallel validation. Requirements define product behavior. This guide defines work boundaries and order. Task cards refine implementation scope without changing the requirements. A conflict or new product choice must be recorded and resolved, rather than silently changing the accepted behavior.

Documentation and task cards are in English. Player-facing UI, help, status messages, and errors remain in Spanish (RF-39). Keep the existing RF, RT, CA, and BL identifiers for traceability.

## Accepted baseline

Baseline commit: `dc20f5f` on `main`. Do not rebuild the physics experiment from scratch.

| Area | Existing evidence / behavior |
| --- | --- |
| Engine | TypeScript, Rapier 3D 0.19.3, Three.js 0.180.0; pinned dependencies. |
| Geometry | Enclosed tank, interior depth 1.8, ring outer diameter 1.3, two floor-mounted pedestals, peg length 4.35. |
| Dynamics | Fixed 120 Hz step, bounded catch-up, compound ring colliders preserving the hole, physical threading and extraction. |
| Tuning | Pump strength 75; linear water damping 0.50; pulse duration 0.24 s. Preserve these unless the user approves retuning. |
| Jets | Lower side outlets point inward/upward with a weak bottom return current during the pulse; one-button model uses its central outlet. |
| Rules | Collect mode is initially selected in the POC: physical threading plus 0.12 active seconds of pedestal contact removes the ring and accumulates progress. Classic mode retains rings and requires two stable seconds. |
| UI | Pump buttons below the tank; manual tilt, sensor activation, calibration, lab scenes, camera controls, diagnostics, versioned assets, and local no-cache serving exist. |
| Validation | Sixteen engine/rule tests, typecheck, build, local browser checks, and user acceptance of feel. See the report for exact evidence. |

At the baseline commit, production onboarding, menu lifecycle, reliable preferences, themes, audio, mascots, production/lab separation and real mobile validation were unfinished. The October 20 integrated player and its remaining acoustic/physical-device checks are recorded in [the readiness report](validation/release.md). Implementation is not equivalent to full product acceptance. Sensor code exists, but permissions, multitouch, orientation changes, and sustained FPS have not been verified on real reference devices. The sensor and alternative control paths need hardening, not an assumption of compatibility.

Preserve both rule modes when evolving the accepted POC. The collect behavior in section 13 is an explicit exception to classic ring retention and victory rules; do not make classic rings disappear or reapply the classic two-second rule to completed collection. Keep collect as the initial selection from the accepted POC unless the user changes that choice.

## Execution order

| Wave | Tasks | Constraint |
| --- | --- | --- |
| 1 | T01 | Establish boundaries and contracts while preserving the POC. |
| 2 | T02, T03, T04, T05 | May run in parallel after T01 is merged; each owns a different module. |
| 3 | T06 alongside T07, T08, T09 | Run free validation in parallel; UI/themes/audio start after their code dependencies. No T06 completion dependency. |
| 4 | T10 | Build celebration against the integrated theme and session contracts. |
| 5 | T11 | One integration owner wires the production app and asset loading. |
| 6 | T12 | Verify the assembled release, including real devices and offline-after-load behavior. |

T06 does not block UI, themes, audio, celebration or integration. Use existing automated checks, browser viewport/touch/sensor emulation and practical local emulators; optional physical checks use free quota or borrowed/user-owned devices. No paid subscription, billing activation or overage is authorized. T06 completion requires evidence for its free baseline, with unavailable physical checks explicitly not run. This does not waive mobile product criteria or equate emulation with real-device acceptance.

T01–T05 are integrated. T07, T08 and T09 are ready for assignment in the next session; T06 can run alongside them. No new agents or implementation are started by this documentation update. Exact dependencies are listed in each task card; a dependency is satisfied by merged, verified work, not an unmerged branch or an agent's progress message.

## Module boundaries and shared contracts

At baseline, `src/main.ts` mixed rendering, controls, diagnostics and lifecycle; `src/physics.ts` included simulation and rule bookkeeping. T01 extracted cohesive modules and records their actual exported contracts in `docs/module-contracts.md`. The following responsibilities are the intended boundaries, not a requirement to create one file per function:

| Boundary | Suggested ownership | Public responsibility |
| --- | --- | --- |
| Physics adapter | `src/physics/`, compatibility facade `src/physics.ts` | Own Rapier bodies/colliders, fixed stepping, pump impulses, gravity, contact/threading observations, and body removal. |
| Game/session | `src/game/` | Own round identity, rule mode, progress, active simulation time, pause reasons, restart, and once-per-round victory. |
| Input controller | `src/input/` | Turn pointer, keyboard, sensor, and calibration input into pump/orientation commands; own listener cleanup and capability state. |
| Model definitions | `src/models/` | Define fixed button count, outlets, and accepted mechanical configuration; select a model only when starting a round. |
| Preferences | `src/platform/preferences.ts` | Parse and persist supported preferences safely; never serialize a round. |
| Renderer | `src/rendering/` | Render stable ring IDs and snapshots; apply appearance without rebuilding physics; own graphics resources. |
| Theme definitions | `src/themes/`, `public/assets/themes/` | Supply complete appearance and asset manifests, independent of mechanics. |
| Audio / celebration | `src/audio/`, `src/celebration/` | Consume round-scoped events; manage effect lifecycle and disposal. |
| UI / composition | `src/ui/`, `src/app/`, thin entry point | Present Spanish controls and wire services without owning their internal state. |
| Laboratory | `src/lab/` | Keep camera experiments, scenes, tuning, collision debug, and diagnostic export outside the player flow. |

Contracts established in T01 must cover:

- Commands for one pulse, orientation, recentering, starting/restarting a round, and theme selection. Pointer/keyboard repeat handling belongs to inputs, not the renderer.
- A readonly render/session snapshot with round ID, stable ring IDs, poses, active/collected/total counts, mode, and pause/victory state. Rendering must not retain removed Rapier body references.
- Round-scoped semantic events for a pump, a collected ring, and victory. A victory event fires once per round, carries the round identity, and can be ignored when stale.
- Independent pause reasons such as menu, hidden document, manual pause, and restart confirmation. Removing one reason must not resume through another.
- Disposing event listeners, animation callbacks, graphics/audio resources, and pending effects on restart or teardown.
- Complete theme asset manifests and model definitions with no theme fields leaking into physics parameters.

T01 records the actual TypeScript signatures and module paths after extraction. Other agents consume those signatures rather than independently inventing incompatible APIs. The 0.12-second collection contact rule must remain based on active physics steps and actual pedestal contact, with removal coordinated through the physics adapter.

## Assigning work to agents

Use [the board](tasks/README.md) as the single status/owner record. Task cards define scope and dependencies; do not create a second task list in chat that drifts from the board.

1. Confirm prerequisites are integrated. Assign one available card to one agent and record its owner on the board.
2. Give the agent the card path and the prompt below. One agent owns one active task; completing it does not authorize taking the next one.
3. For authorized parallel work, use isolated branches/worktrees from the same integrated baseline. Never have multiple agents edit the same checkout concurrently.
4. Stay within the card's owned paths. If a contract must change, coordinate with its owner before editing shared files.
5. Report changed files, checks, acceptance evidence, remaining limitations, and the commit/branch if one was requested. Do not mark device-dependent work done without recorded device evidence.
6. Integrate one completed task at a time, verify its dependencies and checks against the latest mainline, and then update the board. Integration is part of completion; tests passing on isolated branches do not establish compatibility between them.

Suggested assignment prompt:

```text
Implement only task TXX in docs/tasks/<task-file>.md.
Read AGENTS.md, docs/requirements.md, docs/implementation-guide.md,
docs/module-contracts.md if present, and the task card first.
Check that dependencies are integrated and claim only this task's board row.
Preserve the accepted POC mechanics and the Spanish player interface.
Stay within the task's ownership boundary. Coordinate contract changes.
Run the task's required checks and report evidence and limitations.
Do not start another task, publish, or push unless separately authorized.
```

## Shared files and integration

T01 owns the initial extraction, source entry point, exported contracts, and necessary test/build configuration changes. T02–T05 implement against the extracted seams without changing composition or each other's modules. The parent integrated their lab composition in `c346c1b`. T06 now owns validation evidence/fixtures only; it must coordinate fixes through module owners and never compete for shared composition with T07–T11.

Independently of T06 completion, T07 owns UI files, T08 owns theme/rendering files, T09 owns audio files, and T10 owns celebration files. Each supplies an integration description rather than editing the shared app entry point. T11 is the sole owner of production composition, build wiring, shared HTML/CSS entry points, and cross-module asset startup in that phase.

Changes to `package.json`, the lockfile, build configuration, or contracts require coordination with the active integration owner. Keep pinned versions; do not add libraries just to split work. No task may include unrelated files or erase another agent's uncommitted work.

## Requirement coverage

These are ownership links, not claims that requirements are already satisfied. Multiple tasks may contribute to one criterion; T12 verifies the integrated result.

| Task | Primary requirements / criteria |
| --- | --- |
| T01 | RT-01–RT-06, RT-13–RT-14; preserve RF-06–RF-10, RF-13–RF-16; CA-01–CA-03, CA-05, CA-07; section 13. |
| T02 | RF-11–RF-12, RF-17–RF-24; RT-07–RT-08, RT-11; CA-04, CA-08–CA-09. |
| T03 | RF-10, RF-25–RF-26, RF-30–RF-31, RF-41–RF-42, RF-45; RT-06; CA-07, CA-13–CA-18; section 13. |
| T04 | RF-01–RF-05, RF-11–RF-13; CA-04, CA-11. |
| T05 | RF-44–RF-45; CA-18–CA-19. |
| T06 | RF-06–RF-24; RT-07–RT-09, RT-11, RT-14; CA-01–CA-10. |
| T07 | RF-20–RF-24, RF-39–RF-42; RT-08; CA-08–CA-09, CA-16–CA-17, CA-21. |
| T08 | RF-03, RF-32–RF-38; RT-10, RT-12; CA-11–CA-12, CA-20. |
| T09 | RF-40, RF-43–RF-44; RT-12; CA-19–CA-20. |
| T10 | RF-27–RF-31; RT-10; CA-14–CA-15. |
| T11 | RF-03, RF-37–RF-45; RT-04, RT-10–RT-14; CA-11–CA-12, CA-16–CA-20. |
| T12 | RF-01–RF-45; RT-01–RT-14; CA-01–CA-21, plus section 13. |

BL-02 is already implemented in the POC and must be preserved. BL-01 and BL-03–BL-06 remain outside these tasks: no timer, ring-count editor, customization editor, shake feature, installable PWA, or cold offline launch. Runtime offline-after-load is required and is distinct from PWA installation/cold offline loading.

## Verification and definition of done

Use Node.js 22+ and pnpm 11.25.0. After dependency setup, run `pnpm typecheck`, `pnpm test`, and `pnpm build` for code changes as required by `AGENTS.md`. Use `pnpm serve` for local checks. Add tests for meaningful state transitions and integration failures, not tests that merely copy implementation details. Documentation-only changes need link, requirement-ID, and consistency checks rather than rerunning the physics soak test.

An implementation task is done when its behavior and acceptance items are verified, relevant checks pass, resources are cleaned up correctly, and its integrated state and evidence are recorded on the board. A blocked code dependency or an unexecuted free baseline is not completion. Unavailable physical devices leave specific acceptance criteria not run; they do not block unrelated implementation or completion of a readiness report. User acceptance of the POC remains valid; new mobile or release claims require new evidence.

For real-device records, include model, OS/version, browser/version, orientation, control mode, graphics settings, build/commit, steps, actual result, and attached/exported diagnostics. Use a user-authorized HTTPS test origin; do not replace or publish the original hosted site as an incidental test step.

Task completion does not itself authorize a deployment. T12 prepares a release decision and lists unresolved failures; actual publication is a separate action.
