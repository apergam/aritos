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
| T06 | [Run free mobile validation](T06-mobile-poc-gate.md) | T02, T03, T04 | planned | Unassigned | Ready for the next session; non-blocking; [free paths and pending device evidence](../validation/mobile-access.md) |
| T07 | [Build the Spanish player interface](T07-player-interface.md) | T02, T03, T04, T05 | planned | Unassigned | — |
| T08 | [Implement complete themes](T08-themes.md) | T01, T04 | planned | Unassigned | — |
| T09 | [Implement sound effects](T09-audio.md) | T03, T05 | planned | Unassigned | — |
| T10 | [Implement themed celebration](T10-celebration.md) | T03, T08 | planned | Unassigned | — |
| T11 | [Integrate the production app and assets](T11-production-integration.md) | T07, T08, T09, T10 | planned | Unassigned | — |
| T12 | [Verify the complete release](T12-release-validation.md) | T11 | planned | Unassigned | — |

For an assignment, provide the agent with exactly one task path and the prompt from the guide. Record a branch/commit only after it actually exists. Do not assign overlapping shared-file ownership to parallel agents.

## Next session

T07, T08 and T09 have their code prerequisites integrated and can be assigned independently. T06 may run alongside them as a free validation stream. T10 still depends on T03/T08, T11 on T07–T10, and T12 on T11. This planning update starts no workers or tests tonight; resume only when the user returns.
