# T01 — Extract module boundaries and contracts

Dependencies: None.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), and the [POC report](../POC_REPORT.md). Follow the guide's shared verification and handoff rules.

## Outcome and current state

The accepted POC works, but `src/main.ts` mixes app concerns and `src/physics.ts` mixes simulation and rule bookkeeping. Create stable seams so later agents can own independent modules. This is an extraction task, not a physics redesign or a new game implementation.

## Ownership

Own the initial source extraction, `src/main.ts`, the physics compatibility facade, existing test import adjustments, and necessary build/test wiring. Create `docs/module-contracts.md`. Use the guide's proposed directories, adapting them only when the actual code warrants it. Record actual paths so later cards can follow them.

## Work and acceptance

- Preserve the existing lab scenes, accepted tuning, both rule modes, jets, diagnostics, and camera controls.
- Establish cohesive physics, session, input, model, rendering, UI, and platform boundaries. Keep minimal compatibility exports if necessary for existing tests.
- Record actual signatures for commands, readonly snapshots, stable ring IDs, round-scoped events, pause reasons, theme/model data, and disposal. Avoid placeholder APIs that downstream tasks cannot execute against.
- Retain physical pedestal contact and active-step timing for collection. Do not turn threading into screen-space scoring or make classic rings disappear.
- Keep the entry point as composition. Later agents must be able to implement modules without jointly editing it.

## Verification and handoff

Keep all 16 existing tests passing; typecheck and build must pass. Compare the four lab scenes and camera/diagnostic behavior in a browser with the accepted baseline. Add only meaningful boundary tests needed by the extraction. Report the final module map, contracts, integration extension points, checks, and any behavior differences. Do not implement later cards while extracting their existing behavior.

Coverage: RT-01–RT-06, RT-13–RT-14; preserve RF-06–RF-10, RF-13–RF-16, CA-01–CA-03, CA-05, CA-07, and section 13.
